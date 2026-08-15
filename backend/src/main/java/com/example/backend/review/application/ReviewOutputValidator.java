package com.example.backend.review.application;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import java.util.HashSet;
import java.util.Set;

/** Rejects ungrounded or oversized provider output before a completed Review is persisted. */
public class ReviewOutputValidator {
	private static final Set<String> DIMENSIONS=Set.of("requirementsAndEstimation","decompositionAndApis","dataModelingAndConsistency","scalingAndPerformance","asyncAndDistributedCommunication","reliabilityAndFailureHandling","securityAndPrivacy","operationsAndObservability","tradeoffCommunication");
	private final ObjectMapper mapper;
	public ReviewOutputValidator(ObjectMapper mapper){this.mapper=mapper;}
	public JsonNode validate(String raw,String document,String reasoning){
		try { var output=mapper.readTree(raw); if(!output.isObject()) fail("Review output must be an object"); integer(output,"overallScore",1,5); text(output,"summary",4000); var uncertainty=output.path("uncertainty"); if(!uncertainty.isNumber()||uncertainty.asDouble()<0||uncertainty.asDouble()>1)fail("uncertainty must be between 0 and 1"); var scores=output.path("scores"); if(!scores.isObject()||scores.size()==0||scores.size()>DIMENSIONS.size())fail("scores are invalid"); for(var entry:scores.properties()){if(!DIMENSIONS.contains(entry.getKey())||!entry.getValue().isInt()||entry.getValue().asInt()<1||entry.getValue().asInt()>5)fail("scores are invalid");}
			var findings=output.path("findings"); if(!findings.isArray()||findings.size()>20)fail("findings are invalid"); var evidenceIds=evidenceIds(document,reasoning); for(var finding:findings){if(!finding.isObject())fail("findings are invalid"); text(finding,"id",64); text(finding,"message",1000); text(finding,"severity",32); var evidence=finding.path("evidence");if(!evidence.isArray()||evidence.size()==0||evidence.size()>8)fail("findings need bounded evidence");for(var item:evidence){if(!item.isObject()||!item.path("sourceType").isTextual()||!item.path("sourceId").isTextual()||!evidenceIds.contains(item.path("sourceId").asText()))fail("finding evidence is not grounded in the immutable revision");}}
			return output;
		} catch(ReviewProcessingExceptions.InvalidReviewOutputException exception){throw exception;} catch(Exception exception){throw new ReviewProcessingExceptions.InvalidReviewOutputException("Review output is not valid JSON");}
	}
	private Set<String> evidenceIds(String document,String reasoning) throws Exception { var ids=new HashSet<String>(); var doc=mapper.readTree(document); for(var item:doc.path("components"))ids.add(item.path("id").asText()); for(var item:doc.path("connections"))ids.add(item.path("id").asText()); var context=mapper.readTree(reasoning); addIds(context.path("reasoning").path("requirements"),ids); addIds(context.path("completedScenarios"),ids); return ids; }
	private void addIds(JsonNode values,Set<String> ids){if(values.isArray())for(var item:values){var id=item.path("id").asText();if(!id.isBlank())ids.add(id);}}
	private void text(JsonNode node,String name,int max){if(!node.path(name).isTextual()||node.path(name).asText().isBlank()||node.path(name).asText().length()>max)fail(name+" is invalid");}
	private void integer(JsonNode node,String name,int min,int max){if(!node.path(name).isInt()||node.path(name).asInt()<min||node.path(name).asInt()>max)fail(name+" is invalid");}
	private void fail(String message){throw new ReviewProcessingExceptions.InvalidReviewOutputException(message);}
}
