import { getToken } from "@auth/core/jwt";

async function readTokenPair(request) {
  const secret = process.env.AUTH_SECRET;

  const secure = await Promise.all([
    getToken({ req: request, secret, secureCookie: true, raw: true }),
    getToken({ req: request, secret, secureCookie: true }),
  ]);

  if (secure[1]) {
    return { raw: secure[0], jwt: secure[1] };
  }

  const insecure = await Promise.all([
    getToken({ req: request, secret, secureCookie: false, raw: true }),
    getToken({ req: request, secret, secureCookie: false }),
  ]);

  return { raw: insecure[0], jwt: insecure[1] };
}

export async function GET(request) {
  const { raw: token, jwt } = await readTokenPair(request);

  if (!jwt) {
    return new Response(
      `
			<html>
				<body>
					<script>
						window.parent.postMessage({ type: 'AUTH_ERROR', error: 'Unauthorized' }, '*');
					</script>
				</body>
			</html>
			`,
      {
        status: 401,
        headers: {
          "Content-Type": "text/html",
        },
      },
    );
  }

  const message = {
    type: "AUTH_SUCCESS",
    jwt: token,
    user: {
      id: jwt.sub,
      email: jwt.email,
      name: jwt.name,
    },
  };

  return new Response(
    `
		<html>
			<body>
				<script>
					window.parent.postMessage(${JSON.stringify(message)}, '*');
				</script>
			</body>
		</html>
		`,
    {
      headers: {
        "Content-Type": "text/html",
      },
    },
  );
}
