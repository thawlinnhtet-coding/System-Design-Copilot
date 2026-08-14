package com.example.backend.architecture.application;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;

class PortablePackageValidatorTests {

	private final ObjectMapper objectMapper = new ObjectMapper();
	private final PortablePackageValidator validator = new PortablePackageValidator(objectMapper);

	@Test
	void acceptsAValidPortablePackage() throws Exception {
		var result = validator.validate(objectMapper.readTree(validPackage()));

		assertThat(result.valid()).isTrue();
		assertThat(result.packageNode()).isNotNull();
		assertThat(result.errors()).isEmpty();
	}

	@Test
	void reportsSafePathsForServerOwnedFieldsWithoutEchoingTheirValues() throws Exception {
		var result = validator.validate(objectMapper.readTree(validPackage().replace(
				"\"requirements\":[]",
				"\"requirements\":[{\"statement\":\"Keep this private\",\"billing\":{\"plan\":\"PRO\"}}]")));

		assertThat(result.valid()).isFalse();
		assertThat(result.errors())
				.extracting(PortablePackageValidator.ValidationError::path)
				.contains("/workspace/requirements/0/billing", "/workspace/requirements/0/billing/plan");
		assertThat(result.errors()).allSatisfy(error -> {
			assertThat(error.reason()).doesNotContain("PRO");
			assertThat(error.correction()).isNotBlank();
		});
	}

	@Test
	void rejectsUnsupportedVersionsAndUnsafeContent() throws Exception {
		var result = validator.validate(objectMapper.readTree(validPackage()
				.replace("\"schemaVersion\":1", "\"schemaVersion\":2")
				.replace("Event ingestion", "javascript:alert(1)")));

		assertThat(result.valid()).isFalse();
		assertThat(result.errors()).extracting(PortablePackageValidator.ValidationError::path)
				.contains("/schemaVersion", "/workspace/title");
	}

	@Test
	void rejectsPackagesAboveTheOneMiBLimit() throws Exception {
		var oversized = validPackage().replace("Event ingestion", "x".repeat(PortablePackageValidator.MAX_BYTES));

		var result = validator.validate(objectMapper.readTree(oversized));

		assertThat(result.errors()).extracting(PortablePackageValidator.ValidationError::path).contains("$");
	}

	private String validPackage() {
		return """
				{
				  "format":"system-design-copilot",
				  "schemaVersion":1,
				  "workspace":{
				    "title":"Event ingestion",
				    "requirements":[],
				    "assumptions":[],
				    "decisions":[],
				    "architecture":{
				      "schemaVersion":1,
				      "components":[],
				      "connections":[],
				      "boundaries":[]
				    }
				  }
				}
				""";
	}
}
