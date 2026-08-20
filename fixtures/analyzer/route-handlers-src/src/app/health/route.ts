const healthCheck = () => Response.json({ status: "ok" });

export { healthCheck as GET };
