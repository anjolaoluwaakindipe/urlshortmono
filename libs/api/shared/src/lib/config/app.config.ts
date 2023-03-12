import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

const ENV = process.env.NODE_ENV

@Module({
    imports: [ConfigModule.forRoot({
        envFilePath: !ENV ? "apps/.env.development" : `apps/.env.${ENV}`,
        isGlobal: true
    })]
})
export class AppConfig{}