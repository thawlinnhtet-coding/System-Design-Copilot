package com.example.backend.workspace.api;

import com.example.backend.workspace.application.WorkspaceExceptions.WorkspaceNotFoundException;
import com.example.backend.workspace.application.WorkspaceExceptions.WorkspaceArchivedException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;

@RestControllerAdvice
class WorkspaceProblemAdvice {

	@ExceptionHandler(WorkspaceNotFoundException.class)
	ProblemDetail workspaceNotFound(WorkspaceNotFoundException exception) {
		var problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
		problem.setTitle("Workspace not found");
		problem.setType(URI.create("https://system-design-copilot.dev/problems/workspace-not-found"));
		problem.setProperty("code", "workspace_not_found");
		return problem;
	}

	@ExceptionHandler(WorkspaceArchivedException.class)
	ProblemDetail workspaceArchived(WorkspaceArchivedException exception) {
		var problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, exception.getMessage());
		problem.setTitle("Workspace is archived");
		problem.setType(URI.create("https://system-design-copilot.dev/problems/workspace-archived"));
		problem.setProperty("code", "workspace_archived");
		return problem;
	}
}
