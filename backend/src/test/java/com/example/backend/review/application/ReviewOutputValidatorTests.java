package com.example.backend.review.application;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ReviewOutputValidatorTests {
	private final ReviewOutputValidator validator=new ReviewOutputValidator(new ObjectMapper());
	@Test void rejectsMalformedAndUngroundedOutput(){assertThrows(ReviewProcessingExceptions.InvalidReviewOutputException.class,()->validator.validate("not-json","{}","{}"));assertThrows(ReviewProcessingExceptions.InvalidReviewOutputException.class,()->validator.validate("{\"overallScore\":4,\"summary\":\"Fine\",\"uncertainty\":0.2,\"scores\":{\"scalingAndPerformance\":4},\"findings\":[{\"id\":\"f\",\"severity\":\"MEDIUM\",\"message\":\"Missing evidence\",\"evidence\":[{\"sourceType\":\"COMPONENT\",\"sourceId\":\"unknown\"}]}]}","{\"components\":[],\"connections\":[]}","{}"));}
	@Test void acceptsBoundedEvidenceGroundedOutput(){assertDoesNotThrow(()->validator.validate("{\"overallScore\":4,\"summary\":\"Fine\",\"uncertainty\":0.2,\"scores\":{\"scalingAndPerformance\":4},\"findings\":[{\"id\":\"f\",\"severity\":\"MEDIUM\",\"message\":\"Document capacity.\",\"evidence\":[{\"sourceType\":\"COMPONENT\",\"sourceId\":\"api\"}]}]}","{\"components\":[{\"id\":\"api\"}],\"connections\":[]}","{}"));}
}
