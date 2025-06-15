const Fastify = require("fastify")

function buildFastify() {
    const fastify = Fastify()

    fastify.get("/", async (request, reply) => {
        const username = request.query.username
        if (!username) {
            reply.status(400).send({ error: "Username is required" })
            return
        }

        return {
            username,
            message: `Hello, ${username}! Welcome to our API.`,
        }
    })

    return fastify
}

module.exports = buildFastify
