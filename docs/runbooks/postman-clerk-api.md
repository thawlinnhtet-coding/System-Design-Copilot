# Test The API With A Clerk JWT In Postman

Do not delay API testing until the frontend is complete. The backend already has the Clerk JWT contract, and Postman can exercise it with a short-lived token from a local Clerk session.

## Environment

Create a Postman environment with these variables:

| Variable | Local value |
| --- | --- |
| `api_base_url` | `http://localhost:8080` |
| `frontend_origin` | `http://localhost:3000` |
| `clerk_jwt` | Leave blank until copied from a signed-in browser session |
| `workspace_id` | Leave blank; set it from the create response |

Never commit a real JWT or put one in a shared Postman environment. API JWTs are short-lived bearer credentials.

## Get A Token

1. Start the frontend with the local Clerk configuration and sign in through the existing Clerk modal.
2. Open the browser developer console on the signed-in frontend.
3. Run:

```js
const token = await window.Clerk.session.getToken({ template: "system-design-copilot-api" });
copy(token);
```

4. Paste the value into the local Postman `clerk_jwt` variable.

## Requests

For every protected request, set Authorization to **Bearer Token** with `{{clerk_jwt}}`.

| Method | URL | Expected result |
| --- | --- | --- |
| `GET` | `{{api_base_url}}/api/v1/me` | `200`, the durable User for the Clerk subject |
| `GET` | `{{api_base_url}}/api/v1/me/usage` | `200`, Free Plan and current allowances |
| `GET` | `{{api_base_url}}/api/v1/workspaces` | `200`, owned Workspaces only |
| `POST` | `{{api_base_url}}/api/v1/workspaces` | `201`, create a blank custom Workspace |
| `PATCH` | `{{api_base_url}}/api/v1/workspaces/{{workspace_id}}` | `200`, renamed Workspace |
| `POST` | `{{api_base_url}}/api/v1/workspaces/{{workspace_id}}/archive` | `200`, archived Workspace and released allowance |
| `POST` | `{{api_base_url}}/api/v1/workspaces/{{workspace_id}}/restore` | `200`, active Workspace and consumed allowance |
| `DELETE` | `{{api_base_url}}/api/v1/workspaces/{{workspace_id}}` | `204`, permanently deleted Workspace |

The create request body is:

```json
{
  "name": "Event ingestion platform",
  "description": "Practice a reliable event ingestion system for multiple producers."
}
```

The rename request body is:

```json
{
  "name": "Reliable event ingestion platform"
}
```

## Failure Checks

- Remove the token: the API should return `401`.
- Replace the token with an expired or differently issued token: the API should return `401`.
- Use a Workspace ID owned by another User: the API should return `404` with `code: workspace_not_found`.
- Create more active Workspaces than the Free allowance: the API should return `429` with `code: allowance_exceeded`.
