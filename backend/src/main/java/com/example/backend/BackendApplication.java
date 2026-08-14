package com.example.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

import com.example.backend.billing.application.BillingProperties;
import com.example.backend.entitlement.application.EntitlementProperties;
import com.example.backend.ai.application.AiProviderProperties;

import java.time.Clock;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@EnableConfigurationProperties({EntitlementProperties.class, BillingProperties.class, AiProviderProperties.class})
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

	@Bean
	Clock clock() {
		return Clock.systemUTC();
	}

	@Bean
	com.example.backend.ai.application.AiConsentPolicy aiConsentPolicy(AiProviderProperties properties) {
		return new com.example.backend.ai.application.AiConsentPolicy(properties.consentPolicyVersion());
	}

}
