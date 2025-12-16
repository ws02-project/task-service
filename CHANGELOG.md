# Changelog

## 1.0.0 (2025-12-16)


### Features

* add environment configuration file and update .gitignore ([711a10d](https://github.com/ws02-project/task-service/commit/711a10d365f65ed7521ab464601b994a7a09691b))
* add gRPC integration for project service ([2cb0da0](https://github.com/ws02-project/task-service/commit/2cb0da08c02f3f4c788b084669ca8d5128e3ac31))
* add README and CI/CD workflow for Task Service ([85761f1](https://github.com/ws02-project/task-service/commit/85761f18af04f3cfd9911f165b6c920089f1f5b8))
* add release-please for automatic semantic versioning ([c6e1442](https://github.com/ws02-project/task-service/commit/c6e14423dd589849dd91f6ff7ae98c2c11f8a552))
* add task assignment feature with event publishing ([b6fd45f](https://github.com/ws02-project/task-service/commit/b6fd45fe6b1dbd62c753557097c83b13e2f1fdff))
* **ci:** add unit and integration tests ([f48d78e](https://github.com/ws02-project/task-service/commit/f48d78edb4e30984694ca6ea11689e707c66f257))
* **ci:** include commit message in deployment updates ([b5ceca4](https://github.com/ws02-project/task-service/commit/b5ceca4378cbadd666451f720319689c6fa1cb09))
* **database:** add PostgreSQL configuration and initialization ([46da717](https://github.com/ws02-project/task-service/commit/46da717a9e261d52c7e1a262677cfbf4b94b01a5))
* initialize task service with CRUD operations and API endpoints ([335c446](https://github.com/ws02-project/task-service/commit/335c4466e564d4d07ae118a50a04c9830ed727a2))
* integrate RabbitMQ for task event handling ([0147931](https://github.com/ws02-project/task-service/commit/0147931e7d57bcc12fcd966efca747e6fb644278))
* **logging:** add structured logging for Fluent Bit and OpenSearch ([a886ec0](https://github.com/ws02-project/task-service/commit/a886ec052b0bcc3810a4ed40abb7d3a73d151f15))
* **renovate:** disable automerge for Express and Node.js ([1bc31cf](https://github.com/ws02-project/task-service/commit/1bc31cf03c3d51cc93a17839784fc038ea642984))
* **renovate:** enable automerge for major versions ([613a55e](https://github.com/ws02-project/task-service/commit/613a55edbe3db81bef2114119d468965a584818e))
* **renovate:** group all deps into single PR ([1544266](https://github.com/ws02-project/task-service/commit/154426656698a5a4d4f548b6168dd7fa12fefb05))
* skip health endpoint logging and add ENVIRONMENT variable support ([178cd02](https://github.com/ws02-project/task-service/commit/178cd02b15501c111b05e50ffd7907e63f834f06))


### Bug Fixes

* add migration script with retry logic and exclude PostgreSQL from Istio ([8b95965](https://github.com/ws02-project/task-service/commit/8b959657ef421982e037f9fde506f0b94da4601e))
* add retry logic and connection timeout for database connections ([2f70ccd](https://github.com/ws02-project/task-service/commit/2f70ccd07ffd8b47ef153c28958bad6ffcd96b09))
* **deps:** update all dependencies ([0add4de](https://github.com/ws02-project/task-service/commit/0add4dec15112c95a4487fbece04a8634f5453da))
* **deps:** update all dependencies (major) ([77bac57](https://github.com/ws02-project/task-service/commit/77bac575e1281b6806bb788d96d0935c2c10a944))
* **deps:** update dependency dotenv to v17 ([5cfe792](https://github.com/ws02-project/task-service/commit/5cfe792e6840299f70aab423b6d2382083a067bc))
* **deps:** update dependency dotenv to v17 ([408a6d1](https://github.com/ws02-project/task-service/commit/408a6d19e9ddf78a4ead8329732a7fc420ba5931))
* **deps:** update dependency helmet to v8 ([4673413](https://github.com/ws02-project/task-service/commit/46734139daf0c9324f04fdf8314ec76f4a48e560))
* **deps:** update dependency helmet to v8 ([b9cfc9f](https://github.com/ws02-project/task-service/commit/b9cfc9fd77d6070f154a4572bc55ad1dea602bc2))
* **deps:** update dependency joi to v18 ([000cafb](https://github.com/ws02-project/task-service/commit/000cafb9730dfb082a34f7c3e19543474ea4ea8f))
* **deps:** update dependency joi to v18 ([676ccc0](https://github.com/ws02-project/task-service/commit/676ccc0e92016fe3f4d226189fa5ad525a8ec0ca))
* improve commit message extraction for merge commits ([af49fda](https://github.com/ws02-project/task-service/commit/af49fda0623c4aa065cf5530d73e6604ffaaffa3))
* mock uuid globally in test setup to handle ESM module ([a2a15e5](https://github.com/ws02-project/task-service/commit/a2a15e55ba3807c461a7bb03db1ae4de297e25c7))
* prefix unused res parameter with underscore in errorLogger ([96d54dd](https://github.com/ws02-project/task-service/commit/96d54dd768a87e77c2ddbf413caf7be5c3c3b74e))
* remove invalid wildcard pattern from CORS options handler ([7bc0e3b](https://github.com/ws02-project/task-service/commit/7bc0e3b220bc5d07439146ec3bb7a0cdb6be48c5))
* remove npm from production image to fix glob CVE-2025-64756 ([2241bbd](https://github.com/ws02-project/task-service/commit/2241bbdebfaf19ac624906fd0d24e00d30843ad7))
* **renovate:** remove platformAutomerge for GitHub Free compatibility ([fede1ad](https://github.com/ws02-project/task-service/commit/fede1ada68d7f8bc7ba9c243286e2517a74beb0c))
* revert to GITHUB_TOKEN for release-please ([863e9b8](https://github.com/ws02-project/task-service/commit/863e9b8ca64a19f81e2f19f93bf21fb75ca4db1b))
* update database migration path based on environment ([86574bd](https://github.com/ws02-project/task-service/commit/86574bd0ee887f9940b0b615c7bdfec946cb7311))
* update Jest config for ESM modules and add type annotations ([10090bd](https://github.com/ws02-project/task-service/commit/10090bde901440d7d277ea8c69d16c4e126ce1a1))
* use PAT_TOKEN for release-please to bypass org restrictions ([e013bfe](https://github.com/ws02-project/task-service/commit/e013bfe13ef883d935cedc5327f1c6f257ea5c92))
* use pnpm exec jest for CI test command ([5427fd2](https://github.com/ws02-project/task-service/commit/5427fd2336640fc91f061881e6cad68ffcb7a441))
