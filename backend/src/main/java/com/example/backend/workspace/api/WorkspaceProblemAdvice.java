package com.example.backend.workspace.api;

import com.example.backend.workspace.application.WorkspaceExceptions.WorkspaceNotFoundException;
import com.example.backend.workspace.application.WorkspaceExceptions.WorkspaceArchivedException;
import com.example.backend.workspace.application.WorkspaceExceptions.InvalidWorkspaceTypeSourceException;
import com.example.backend.workspace.application.WorkspaceExceptions.InvalidWorkspaceFocusException;
import com.example.backend.workspace.application.WorkspaceExceptions.WorkspaceDeletionConfirmationMismatchException;
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

	@ExceptionHandler(InvalidWorkspaceTypeSourceException.class)
	ProblemDetail invalidWorkspaceTypeSource(InvalidWorkspaceTypeSourceException exception) {
		var problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, exception.getMessage());
		problem.setTitle("Invalid Workspace Type and Source");
		problem.setType(URI.create("https://system-design-copilot.dev/problems/invalid-workspace-type-source"));
		problem.setProperty("code", "invalid_workspace_type_source");
		return problem;
	}

	@ExceptionHandler(InvalidWorkspaceFocusException.class)
	ProblemDetail invalidWorkspaceFocus(InvalidWorkspaceFocusException exception) {
		var problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, exception.getMessage());
		problem.setTitle("Invalid Workspace focus");
		problem.setType(URI.create("https://system-design-copilot.dev/problems/invalid-workspace-focus"));
		problem.setProperty("code", "invalid_workspace_focus");
		return problem;
	}

	@ExceptionHandler(WorkspaceDeletionConfirmationMismatchException.class)
	ProblemDetail workspaceDeletionConfirmationMismatch(WorkspaceDeletionConfirmationMismatchException exception) {
		var problem = ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_ENTITY, exception.getMessage());
		problem.setTitle("Workspace name does not match");
		problem.setType(URI.create("https://system-design-copilot.dev/problems/workspace-deletion-confirmation-mismatch"));
		problem.setProperty("code", "workspace_deletion_confirmation_mismatch");
		return problem;
	}
}
