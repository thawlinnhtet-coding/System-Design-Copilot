package com.example.backend.review.application;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import java.util.HashSet;
import java.util.Set;

/** Rejects ungrounded or oversized provider output before a completed Review is persisted. */
public class ReviewOutputValidator {
	private static final Set<String> DIMENSIONS=Set.of("requirementsAlignment","scalabilityAndCapacity","reliabilityAndFailureHandling","dataModelingAndConsistency","performanceAndBottlenecks","securityAndOperability","tradeoffCommunication");
	private static final Set<String> SEVERITIES=Set.of("CRITICAL","HIGH","MEDIUM","LOW","OBSERVATION");
	private static final Set<String> SOURCE_TYPES=Set.of("REQUIREMENT","ASSUMPTION","COMPONENT","CONNECTION","DECISION","SCENARIO");
	private final ObjectMapper mapper;
	public ReviewOutputValidator(ObjectMapper mapper){this.mapper=mapper;}
	public JsonNode validate(String raw,String document,String reasoning){
		try { var output=mapper.readTree(raw); if(!output.isObject()) fail("Review output must be an object"); text(output,"summary",4000); var uncertainty=output.path("uncertainty"); if(!uncertainty.isNumber()||uncertainty.asDouble()<0||uncertainty.asDouble()>1)fail("uncertainty must be between 0 and 1"); var scores=output.path("scores"); if(!scores.isObject()||scores.size()!=DIMENSIONS.size())fail("scores are invalid"); for(var entry:scores.properties()){if(!DIMENSIONS.contains(entry.getKey())||!entry.getValue().isInt()||entry.getValue().asInt()<1||entry.getValue().asInt()>5)fail("scores are invalid");}
			var findings=output.path("findings"); if(!findings.isArray()||findings.size()>20)fail("findings are invalid"); var evidenceIds=evidenceIds(document,reasoning); for(var finding:findings){if(!finding.isObject())fail("findings are invalid"); text(finding,"id",64); text(finding,"message",1000); text(finding,"severity",32); if(!SEVERITIES.contains(finding.path("severity").asText().toUpperCase()))fail("finding severity is invalid"); optionalText(finding,"impact",1000); optionalText(finding,"recommendation",1000); var evidence=finding.path("evidence");if(!evidence.isArray()||evidence.size()==0||evidence.size()>8)fail("findings need bounded evidence");for(var item:evidence){if(!item.isObject()||!SOURCE_TYPES.contains(item.path("sourceType").asText().toUpperCase())||!item.path("sourceId").isTextual()||!evidenceIds.contains(item.path("sourceId").asText()))fail("finding evidence is not grounded in the immutable revision");}}
			return output;
		} catch(ReviewProcessingExceptions.InvalidReviewOutputException exception){throw exception;} catch(Exception exception){throw new ReviewProcessingExceptions.InvalidReviewOutputException("Review output is not valid JSON");}
	}
	private Set<String> evidenceIds(String document,String reasoning) throws Exception { var ids=new HashSet<String>(); var doc=mapper.readTree(document); addIds(doc.path("components"),ids); addIds(doc.path("connections"),ids); var context=mapper.readTree(reasoning); var reasoningNode=context.path("reasoning"); addIds(reasoningNode.path("requirements"),ids); addIds(reasoningNode.path("assumptions"),ids); addIds(reasoningNode.path("decisions"),ids); addIds(context.path("completedScenarios"),ids); return ids; }
	private void addIds(JsonNode values,Set<String> ids){if(values.isArray())for(var item:values){var id=item.path("id").asText();if(!id.isBlank())ids.add(id);}}
	private void text(JsonNode node,String name,int max){if(!node.path(name).isTextual()||node.path(name).asText().isBlank()||node.path(name).asText().length()>max)fail(name+" is invalid");}
	private void optionalText(JsonNode node,String name,int max){if(!node.path(name).isMissingNode()&&!node.path(name).isNull()&&(!node.path(name).isTextual()||node.path(name).asText().length()>max))fail(name+" is invalid");}
	private void fail(String message){throw new ReviewProcessingExceptions.InvalidReviewOutputException(message);}
}
