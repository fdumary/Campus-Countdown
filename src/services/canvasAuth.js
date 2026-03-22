function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function hashEmail(email) {
  return Array.from(String(email || "")).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

export async function connectCanvasSSO(account) {
  await wait(700);

  if (!account?.schoolEmail) {
    throw new Error("A signed-in account is required before connecting SSO.");
  }

  const numeric = hashEmail(account.schoolEmail) % 900000;

  return {
    ssoLinked: true,
    ssoProvider: "Canvas",
    canvasConnection: {
      canvasUserId: `canvas-${100000 + numeric}`,
      linkedEmail: account.schoolEmail,
      linkedAt: new Date().toISOString(),
      mode: "mock",
    },
  };
}

export async function syncCanvasProfile(account) {
  await wait(650);

  if (!account?.schoolEmail) {
    throw new Error("A signed-in account is required before profile sync.");
  }

  const numeric = hashEmail(account.schoolEmail) % 900000;

  return {
    canvasProfile: {
      canvasUserId: `canvas-${100000 + numeric}`,
      displayName: account.fullName,
      primaryEmail: account.schoolEmail,
      major: "Computer Science",
      enrollment: "Student",
      institution: "Campus SSO",
      source: "Canvas (mock)",
    },
    canvasLastSyncedAt: new Date().toISOString(),
  };
}
