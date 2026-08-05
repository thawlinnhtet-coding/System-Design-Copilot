package com.example.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

import com.example.backend.billing.application.BillingProperties;
import com.example.backend.entitlement.application.EntitlementProperties;

import java.time.Clock;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@EnableConfigurationProperties({EntitlementProperties.class, BillingProperties.class})
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

	@Bean
	Clock clock() {
		return Clock.systemUTC();
	}

}
