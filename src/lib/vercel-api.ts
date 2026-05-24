const VERCEL_API = "https://api.vercel.com";

interface VercelProject {
  id: string;
  name: string;
}

interface VercelDeployHook {
  id: string;
  url?: string;
}

interface VercelEnv {
  id: string;
  key: string;
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
      gitRepository: {
        type: "github",
        repo: repoFullName,
      },
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

export async function createVercelDeployHook(
  token: string,
  projectId: string,
  name: string,
  branch: string,
): Promise<VercelDeployHook> {
  const res = await fetch(
    `${VERCEL_API}/v2/integrations/deploy-hooks`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, projectId, ref: branch }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try { msg = JSON.parse(text).message || text; } catch {}
    throw new Error(`创建 Deploy Hook 失败 (${res.status}): ${msg}`);
  }

  return res.json();
}

function buildDeployHookUrl(projectId: string, hookId: string): string {
  return `https://api.vercel.com/v1/integrations/deploy/${encodeURIComponent(projectId)}/${hookId}`;
}

interface AutoDeployResult {
  projectId: string;
  siteUrl: string;
  deployHookUrl: string;
}

export async function autoDeploy(
  token: string,
  templateRepoFullName: string,
  templateRepoBranch: string,
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

  const hook = await createVercelDeployHook(token, project.id, "Blog Platform Sync", templateRepoBranch);
  const deployHookUrl = hook.url || buildDeployHookUrl(project.id, hook.id);

  return {
    projectId: project.id,
    siteUrl: `https://${project.name}.vercel.app`,
    deployHookUrl,
  };
}
