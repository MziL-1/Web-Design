const VERCEL_API = "https://api.vercel.com";

interface VercelProject {
  id: string;
  name: string;
}

interface VercelEnv {
  id: string;
  key: string;
  value: string;
}

export async function createVercelProject(
  token: string,
  name: string,
  repoFullName: string,
): Promise<VercelProject> {
  const res = await fetch(`${VERCEL_API}/v9/projects`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      gitRepository: { type: "github", repo: repoFullName },
      framework: "nextjs",
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `创建项目失败 (${res.status})`);
  }

  return res.json();
}

export async function setVercelEnv(
  token: string,
  projectId: string,
  key: string,
  value: string,
): Promise<VercelEnv> {
  const res = await fetch(
    `${VERCEL_API}/v9/projects/${encodeURIComponent(projectId)}/env`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key,
        value,
        target: ["production", "preview", "development"],
        type: "plain",
      }),
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `设置环境变量 ${key} 失败 (${res.status})`);
  }

  return res.json();
}

export async function triggerVercelRedeploy(
  token: string,
  projectId: string,
): Promise<void> {
  // Get project info to retrieve git repository details
  const projectRes = await fetch(
    `${VERCEL_API}/v9/projects/${encodeURIComponent(projectId)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!projectRes.ok) {
    const text = await projectRes.text();
    throw new Error(`获取项目信息失败 (${projectRes.status}): ${text}`);
  }

  const project = await projectRes.json();

  // Create a new deployment from the git source
  const res = await fetch(`${VERCEL_API}/v13/deployments?forceNew=1`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: project.name,
      target: "production",
      project: projectId,
      ...(project.link
        ? {
            gitSource: {
              type: project.link.type,
              repoId: project.link.repoId,
              ref: project.link.productionBranch || "main",
            },
          }
        : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try { msg = JSON.parse(text).message || text; } catch {}
    throw new Error(`触发部署失败 (${res.status}): ${msg}`);
  }
}

interface AutoDeployResult {
  projectId: string;
  siteUrl: string;
  vercelToken: string;
}

export async function autoDeploy(
  token: string,
  templateRepoFullName: string,
  templateId: string,
  username: string,
  platformUrl: string,
): Promise<AutoDeployResult> {
  const projectName = `${username}-${templateId}-${Date.now().toString(36)}`
    .replace(/[^a-z0-9-]/g, "-")
    .slice(0, 52);

  const project = await createVercelProject(token, projectName, templateRepoFullName);

  await setVercelEnv(token, project.id, "NEXT_PUBLIC_BLOG_API_URL", platformUrl);
  await setVercelEnv(token, project.id, "NEXT_PUBLIC_USERNAME", username);

  // Trigger redeploy so env vars take effect on the live site
  try {
    await triggerVercelRedeploy(token, project.id);
  } catch {
    // Non-fatal: initial deploy may already be in progress
  }

  return {
    projectId: project.id,
    siteUrl: `https://${project.name}.vercel.app`,
    vercelToken: token,
  };
}
