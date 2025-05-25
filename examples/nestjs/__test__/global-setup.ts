import { Test, TestingModule } from "@nestjs/testing"
import { AppModule } from "../src/app.module"
import { App } from "supertest/types"

declare global {
    interface GlobalThis {
        __APP__: App
    }
}

export default async function globalSetup() {
    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
    }).compile()

    const app = moduleFixture.createNestApplication()
    await app.init()

    globalThis.__APP__ = app.getHttpServer() as App
}
