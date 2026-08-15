package com.example.backend.review.api;

import com.example.backend.ai.application.*;
import com.example.backend.identity.infrastructure.ClerkJwtValidator;
import com.example.backend.review.application.ReviewService;
import com.example.backend.review.infrastructure.ReviewJobRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jwt.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.*;
import org.springframework.boot.test.context.*;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.*;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.test.web.servlet.MockMvc;
import java.security.*;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest @AutoConfigureMockMvc @Import(ReviewControllerTests.TestConfiguration.class)
class ReviewControllerTests {
	private static final String ISSUER="https://clerk.test",AUDIENCE="system-design-copilot-api",AZP="http://localhost:3000"; private static final KeyPair KEY=key();
	@Autowired MockMvc mvc; @Autowired ReviewService service; @Autowired ReviewJobRepository jobs; private final ObjectMapper json=new ObjectMapper();
	@Test void queuesImmutableRevisionAndCompletesDuplicateDeliveryOnlyOnce() throws Exception {var token=token("review_ok_"+System.nanoTime());var workspace=workspace(token,"Serve redirects reliably");document(token,workspace);consent(token);var response=mvc.perform(post("/api/v1/workspaces/{id}/reviews",workspace).header("Authorization",token).header("Idempotency-Key","review-key")).andExpect(status().isAccepted()).andExpect(jsonPath("$.status").value("QUEUED")).andReturn();var body=json.readTree(response.getResponse().getContentAsString());var requestId=UUID.fromString(body.path("id").asText());var job=jobs.findByReviewRequestId(requestId).orElseThrow();assertEquals(ReviewService.ProcessingOutcome.COMPLETED,service.process(job.getId(),"first"));assertEquals(ReviewService.ProcessingOutcome.IGNORED,service.process(job.getId(),"duplicate"));mvc.perform(get("/api/v1/workspaces/{workspace}/reviews/{request}",workspace,requestId).header("Authorization",token)).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("COMPLETED"));}
	private UUID workspace(String token,String idea)throws Exception{var response=mvc.perform(post("/api/v1/workspaces/custom-design").header("Authorization",token).contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Review target\",\"systemIdea\":\""+idea+"\"}")).andExpect(status().isCreated()).andReturn();return UUID.fromString(json.readTree(response.getResponse().getContentAsString()).path("id").asText());}
	private void document(String token,UUID id)throws Exception{var doc="{\"schemaVersion\":1,\"components\":[{\"id\":\"api\",\"type\":\"SERVICE\",\"label\":\"Redirect API\",\"category\":\"COMPUTE\",\"properties\":{\"runtime\":\"JAVA\"}}],\"connections\":[]}";mvc.perform(put("/api/v1/workspaces/{id}/architecture-document",id).header("Authorization",token).contentType(MediaType.APPLICATION_JSON).content("{\"expectedVersion\":0,\"document\":"+doc+"}")).andExpect(status().isOk());}
	private void consent(String token)throws Exception{mvc.perform(put("/api/v1/me/ai-consent").header("Authorization",token).contentType(MediaType.APPLICATION_JSON).content("{\"policyVersion\":\"2026-08-01\"}")).andExpect(status().isOk());}
	private static String token(String subject)throws Exception{var claims=new JWTClaimsSet.Builder().subject(subject).issuer(ISSUER).audience(AUDIENCE).claim("azp",AZP).claim("email_verified",true).issueTime(Date.from(Instant.now())).expirationTime(Date.from(Instant.now().plusSeconds(300))).build();var value=new SignedJWT(new JWSHeader(JWSAlgorithm.RS256),claims);value.sign(new RSASSASigner(KEY.getPrivate()));return "Bearer "+value.serialize();}
	private static KeyPair key(){try{var g=KeyPairGenerator.getInstance("RSA");g.initialize(2048);return g.generateKeyPair();}catch(Exception e){throw new IllegalStateException(e);}}
	@org.springframework.boot.test.context.TestConfiguration static class TestConfiguration {@Bean @Primary JwtDecoder decoder(){var value=NimbusJwtDecoder.withPublicKey((RSAPublicKey)KEY.getPublic()).build();value.setJwtValidator(ClerkJwtValidator.create(ISSUER,AUDIENCE,AZP));return value;}@Bean @Primary AiProviderPort provider(){return ignored->new AiProviderResponse("{\"overallScore\":4,\"summary\":\"Gateway design is clear.\",\"uncertainty\":0.2,\"scores\":{\"scalingAndPerformance\":4},\"findings\":[{\"id\":\"finding-1\",\"severity\":\"MEDIUM\",\"message\":\"Document saturation handling.\",\"evidence\":[{\"sourceType\":\"COMPONENT\",\"sourceId\":\"api\"}]}]}","success","review-test");}}
}
