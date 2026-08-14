package com.example.backend.ai.infrastructure;

import com.example.backend.ai.application.AiProviderExceptions;
import com.example.backend.ai.application.AiProviderPort;
import com.example.backend.ai.application.AiProviderRequest;
import com.example.backend.ai.application.AiProviderResponse;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/** Spring AI adapter for the one permitted OpenRouter provider route. */
@Component
class OpenRouterAiProvider implements AiProviderPort {

	private final ChatModel chatModel;

	OpenRouterAiProvider(ChatModel chatModel) {
		this.chatModel = chatModel;
	}

	@Override
	public AiProviderResponse invoke(AiProviderRequest request) {
		var options = OpenAiChatOptions.builder()
				.model(request.model())
				.maxCompletionTokens(request.maxOutputTokens())
				.extraBody(Map.of("provider", Map.of(
						"data_collection", request.providerPolicy().dataCollection(),
						"allow_fallbacks", request.providerPolicy().allowFallbacks())))
				.build();
		try {
			var response = chatModel.call(new Prompt(
					List.of(new SystemMessage(request.systemInstruction()), new UserMessage(request.untrustedContext())),
					options));
			var generation = response == null ? null : response.getResult();
			var content = generation == null ? null : generation.getOutput().getText();
			if (content == null || content.isBlank()) {
				throw new AiProviderExceptions.UnavailableException();
			}
			var metadata = response.getMetadata();
			var usage = metadata.getUsage();
			return new AiProviderResponse(
					content,
					metadata.getId(),
					metadata.getModel(),
					usage == null ? null : usage.getPromptTokens(),
					usage == null ? null : usage.getCompletionTokens(),
					null
			);
		} catch (AiProviderExceptions.UnavailableException exception) {
			throw exception;
		} catch (RuntimeException exception) {
			throw new AiProviderExceptions.UnavailableException(exception);
		}
	}
}
