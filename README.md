<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ yarn install
```

## Running the app

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Test

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).

## Playground

```

yarn repl

openAIService = await get(OpenAIService).createWallpaperGeneratingPrompt()

{
  prompt: 'Create a vibrant, surreal landscape at twilight, with rolling hills covered in emerald green and indigo flowers under a sky painted in gradients of violet, fuchsia, and rose. In the background, a majestic, teal-colored waterfall cascading into a serene pool adds a sense of motion, while fireflies with amber glow add dots of light to the scene. The art style should be a blend of impressionism and fantasy.',
  styles: [ 'impressionism', 'fantasy' ],
  tags: [
    'vibrant',   'surreal',
    'landscape', 'twilight',
    'hills',     'flowers',
    'sky',       'gradient',
    'waterfall', 'fireflies',
    'serene',    'motion',
    'light'
  ],
  colors: [
    'emerald', 'indigo',
    'violet',  'fuchsia',
    'rose',    'teal',
    'amber'
  ]
}


await get(OpenAIService).generateWallpaper('Create a vibrant, surreal landscape at twilight, with rolling hills covered in emerald green and indigo flowers under a sky painted in gradients of violet, fuchsia, and rose. In the background, a majestic, teal-colored waterfall cascading into a serene pool adds a sense of motion, while fireflies with amber glow add dots of light to the scene. The art style should be a blend of impressionism and fantasy.')

await get(ReplicateService).upscale('https://oaidalleapiprodscus.blob.core.windows.net/private/org-eTyw7kmLu5hbd57Usik1ap7q/user-PzvCJnigMUoZBOaOFetrviQ8/img-gXeGaRKwzYNvOv26wqvnd3s7.png?st=2023-12-31T05%3A24%3A20Z&se=2023-12-31T07%3A24%3A20Z&sp=r&sv=2021-08-06&sr=b&rscd=inline&rsct=image/png&skoid=6aaadede-4fb3-4698-a8f6-684d7786b067&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2023-12-30T18%3A30%3A33Z&ske=2023-12-31T18%3A30%3A33Z&sks=b&skv=2021-08-06&sig=vX/2T5jlFxx47SMcTnS2fGAfBfbYtyKRPzruOeFch4k%3D')


await get(GenerateWallpaperScheduler).insertWallpaperIntoDatabase({
input: {
      engine: 'dall-e',
      prompt:
        'Create a vibrant, surreal landscape at twilight, with rolling hills covered in emerald green and indigo flowers under a sky painted in gradients of violet, fuchsia, and rose. In the background, a majestic, teal-colored waterfall cascading into a serene pool adds a sense of motion, while fireflies with amber glow add dots of light to the scene. The art style should be a blend of impressionism and fantasy.',
      styles: ['impressionism', 'fantasy'],
      tags: [
        'vibrant',
        'surreal',
        'landscape',
        'twilight',
        'hills',
        'flowers',
        'sky',
        'gradient',
        'waterfall',
        'fireflies',
        'serene',
        'motion',
        'light',
      ],
      colors: [
        'emerald',
        'indigo',
        'violet',
        'fuchsia',
        'rose',
        'teal',
        'amber',
      ],
    },
    objectKey: 'FAKE_OBJECT_KEY',
    imageKey: 'FAKE_IMAGE_KEY',
})

await get(GenerateWallpaperScheduler).generateWallpaper()
```
