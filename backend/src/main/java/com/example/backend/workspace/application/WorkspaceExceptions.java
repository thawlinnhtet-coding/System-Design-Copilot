package com.example.backend.workspace.application;

public final class WorkspaceExceptions {

	private WorkspaceExceptions() {
	}

	public static class WorkspaceNotFoundException extends RuntimeException {
		public WorkspaceNotFoundException() {
			super("The Workspace does not exist or is not owned by the current User");
		}
	}

	public static class WorkspaceArchivedException extends RuntimeException {
		public WorkspaceArchivedException() {
			super("Restore the Workspace before editing its reasoning");
		}
	}

	public static class InvalidWorkspaceTypeSourceException extends RuntimeException {
		public InvalidWorkspaceTypeSourceException() {
			super("The Workspace Type and Source combination is not valid");
		}
	}
}
