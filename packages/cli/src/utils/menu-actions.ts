import { select, input, Separator } from '@inquirer/prompts';
import { colorize } from './colors.js';
import {
  AIModelService,
  FeatureService,
  ResponseClassService,
} from 'monopro-ai';

export async function listFeatures(
  command: any,
  services: {
    featureService: FeatureService;
    responseClassService: ResponseClassService;
    aiModelService: AIModelService;
  },
) {
  const { featureService, responseClassService, aiModelService } = services;
  const features = await featureService.getFeatures();

  const selectedFeature = await select({
    message: colorize('Select a feature to view details:', 'yellow'),
    choices: features.map((f) => ({ name: f.name, value: f.id })),
  });

  const feature = features.find((f) => f.id === selectedFeature);

  if (feature) {
    command.log(
      colorize(
        `\nFeature Details:\nName: ${feature.name}\nDescription: ${feature.description}\nModel: ${feature.model}`,
        'green',
      ),
    );

    const nextAction = await select({
      message: colorize('What would you like to do?', 'yellow'),
      choices: [
        {
          name: 'View Prompts',
          value: 'viewPrompts',
          description: 'View and manage testing prompts for this feature',
        },
        {
          name: 'View Response Classes',
          value: 'viewResponseClasses',
          description: 'View and manage response classes for this feature',
        },
        {
          name: 'View Use Cases',
          value: 'viewUseCases',
          description: 'View and manage use cases for this feature',
        },
        new Separator(),
        {
          name: 'Create a Prompt',
          value: 'createPrompt',
          description: 'Create a new testing prompt for this feature',
        },
        {
          name: 'Create a Response Class',
          value: 'createResponseClass',
          description: 'Create a new response class for this feature',
        },
        {
          name: 'Create a Use Case',
          value: 'createUseCase',
          description: 'Create a new use case for this feature',
        },
        new Separator(),
        {
          name: 'Back to Feature List',
          value: 'backToFeatures',
          description: 'Return to the feature list',
        },
        {
          name: 'Back to Home',
          value: 'backToHome',
          description: 'Return to the main menu',
        },
      ],
    });

    await handleFeatureAction(command, nextAction, feature.id, {
      featureService,
      responseClassService,
      aiModelService,
    });
  }
}

export async function handleFeatureAction(
  command: any,
  action: string,
  featureId: number,
  services: {
    featureService: FeatureService;
    responseClassService: ResponseClassService;
    aiModelService: AIModelService;
  },
) {
  switch (action) {
    case 'viewPrompts':
      await viewPrompts(command, featureId, services);
      break;
    case 'viewResponseClasses':
      await viewResponseClasses(command, featureId, services);
      break;
    case 'viewUseCases':
      await viewUseCases(command, featureId, services);
      break;
    case 'createPrompt':
      await createPrompt(command, featureId, services.aiModelService);
      break;
    case 'createResponseClass':
      await createResponseClass(
        command,
        featureId,
        services.responseClassService,
      );
      break;
    case 'createUseCase':
      await createUseCase(command, featureId);
      break;
    case 'backToFeatures':
      await listFeatures(command, services);
      break;
    case 'backToHome':
      command.run();
      break;
  }
}

async function viewPrompts(
  command: any,
  featureId: number,
  services: {
    featureService: FeatureService;
    responseClassService: ResponseClassService;
    aiModelService: AIModelService;
  },
) {
  const prompts =
    await services.aiModelService.getPromptsByFeatureId(featureId);

  if (prompts.length === 0) {
    command.log(colorize('No prompts found for this feature.', 'red'));
    return;
  }

  const selectedPrompt = await select({
    message: colorize(`Select a prompt to view:`, 'yellow'),
    choices: prompts.map((p) => ({ name: p.content, value: p.id })),
  });

  const prompt = prompts.find((p) => p.id === selectedPrompt);

  if (prompt) {
    command.log(
      colorize(
        `\nPrompt Details: \nContent: ${prompt.content}\nFeature ID: ${prompt.featureId}`,
        'green',
      ),
    );

    const action = await select({
      message: colorize('What would you like to do?', 'yellow'),
      choices: [
        {
          name: 'Edit Prompt',
          value: 'editPrompt',
          description: 'Edit this prompt',
        },
        {
          name: 'Delete Prompt',
          value: 'deletePrompt',
          description: 'Delete this prompt',
        },
        new Separator(),
        {
          name: 'Back to Feature Menu',
          value: 'backToFeatureMenu',
          description: 'Return to the feature menu',
        },
        {
          name: 'Back to Home',
          value: 'backToHome',
          description: 'Return to the main menu',
        },
      ],
    });

    switch (action) {
      case 'editPrompt':
        command.log(colorize(`Editing Prompt: ${prompt.content}`, 'yellow'));
        // Implementar la lógica de edición
        break;
      case 'deletePrompt':
        command.log(colorize(`Deleting Prompt: ${prompt.content}`, 'red'));
        // Implementar la lógica de eliminación
        break;
      case 'backToFeatureMenu':
        await listFeatures(command, services);
        break;
      case 'backToHome':
        command.run();
        break;
    }
  }
}

async function viewUseCases(
  command: any,
  featureId: number,
  services: {
    featureService: FeatureService;
    responseClassService: ResponseClassService;
    aiModelService: AIModelService;
  },
) {
  // Simulación de obtención de casos de uso
  const useCases = [
    { name: 'Use Case 1', id: 'uc1' },
    { name: 'Use Case 2', id: 'uc2' },
  ];

  const selectedUseCase = await select({
    message: colorize(
      `Select a use case to view for feature ${featureId}:`,
      'yellow',
    ),
    choices: useCases.map((uc) => ({ name: uc.name, value: uc.id })),
  });

  const useCase = useCases.find((uc) => uc.id === selectedUseCase);

  if (useCase) {
    command.log(
      colorize(`\nUse Case Details:\nName: ${useCase.name}`, 'green'),
    );

    const action = await select({
      message: colorize('What would you like to do?', 'yellow'),
      choices: [
        {
          name: 'Edit Use Case',
          value: 'editUseCase',
          description: 'Edit this use case',
        },
        {
          name: 'Delete Use Case',
          value: 'deleteUseCase',
          description: 'Delete this use case',
        },
        new Separator(),
        {
          name: 'Back to Feature Menu',
          value: 'backToFeatureMenu',
          description: 'Return to the feature menu',
        },
        {
          name: 'Back to Home',
          value: 'backToHome',
          description: 'Return to the main menu',
        },
      ],
    });

    switch (action) {
      case 'editUseCase':
        command.log(colorize(`Editing Use Case: ${useCase.name}`, 'yellow'));
        // Implementar la lógica de edición
        break;
      case 'deleteUseCase':
        command.log(colorize(`Deleting Use Case: ${useCase.name}`, 'red'));
        // Implementar la lógica de eliminación
        break;
      case 'backToFeatureMenu':
        await listFeatures(command, services);
        break;
      case 'backToHome':
        command.run();
        break;
    }
  }
}

async function viewResponseClasses(
  command: any,
  featureId: number,
  services: {
    featureService: FeatureService;
    responseClassService: ResponseClassService;
    aiModelService: AIModelService;
  },
) {
  const responseClasses =
    await services.responseClassService.getResponseClassesByFeatureId(
      featureId,
    );

  if (responseClasses.length === 0) {
    command.log(colorize('No response classes found for this feature.', 'red'));
    return;
  }
  const selectedResponseClass = await select({
    message: colorize(
      `Select a response class to view for feature ${featureId}:`,
      'yellow',
    ),
    choices: responseClasses.map((rc) => ({ name: rc.name, value: rc.id })),
  });

  const responseClass = responseClasses.find(
    (rc) => rc.id === selectedResponseClass,
  );

  if (responseClass) {
    command.log(
      colorize(
        `\nResponse Class Details:\nName: ${responseClass.name}\nDescription: ${responseClass.description}\nFeature ID: ${responseClass.featureId}`,
        'green',
      ),
    );

    const action = await select({
      message: colorize('What would you like to do?', 'yellow'),
      choices: [
        {
          name: 'Edit Response Class',
          value: 'editResponseClass',
          description: 'Edit this response class',
        },
        {
          name: 'Delete Response Class',
          value: 'deleteResponseClass',
          description: 'Delete this response class',
        },
        new Separator(),
        {
          name: 'Back to Feature Menu',
          value: 'backToFeatureMenu',
          description: 'Return to the feature menu',
        },
        {
          name: 'Back to Home',
          value: 'backToHome',
          description: 'Return to the main menu',
        },
      ],
    });

    switch (action) {
      case 'editResponseClass':
        const responseClassNewName = await input({
          message: colorize(
            `Enter the new name for response class ${responseClass.name}:`,
            'yellow',
          ),
        });
        const responseClassNewDescription = await input({
          message: colorize(
            `Enter the new description for response class ${responseClass.name}:`,
            'yellow',
          ),
        });

        await services.responseClassService.updateResponseClass(
          responseClass.id,
          {
            name: responseClassNewName,
            description: responseClassNewDescription,
            featureId: responseClass.featureId,
          },
        );
        break;
      case 'deleteResponseClass':
        command.log(
          colorize(`Deleting Response Class: ${responseClass.name}`, 'red'),
        );
        await services.responseClassService.deleteResponseClass(
          responseClass.id,
        );

        break;
      case 'backToFeatureMenu':
        await listFeatures(command, services);
        break;
      case 'backToHome':
        command.run();
        break;
    }
  }
}

async function createPrompt(
  command: any,
  featureId: number,
  aiModelService: AIModelService,
) {
  const promptContent = await input({
    message: colorize(
      `Enter the content of the new prompt for feature ${featureId}:`,
      'yellow',
    ),
  });

  command.log(colorize(`Creating Prompt: ${promptContent}`, 'green'));

  await aiModelService.saveAIPrompt(promptContent, featureId);

  command.log(
    colorize(
      `\nPrompt Details: \nContent: ${promptContent}\nFeature ID: ${featureId}`,
      'green',
    ),
  );
}

async function createUseCase(command: any, featureId: number) {
  const useCaseName = await input({
    message: colorize(
      `Enter the name of the new use case for feature ${featureId}:`,
      'yellow',
    ),
  });

  command.log(colorize(`Creating Use Case: ${useCaseName}`, 'green'));
  // Simulación de creación de caso de uso
  // await saveUseCase(featureId, useCaseName);
}

async function createResponseClass(
  command: any,
  featureId: number,
  responseClassService: ResponseClassService,
) {
  const responseClassName = await input({
    message: colorize(
      `Enter the name of the new response class for feature ${featureId}:`,
      'yellow',
    ),
  });
  const responseClassDescription = await input({
    message: colorize(
      `Enter the description of the new response class for feature ${featureId}:`,
      'yellow',
    ),
  });

  command.log(
    colorize(`Creating Response Class: ${responseClassName}`, 'green'),
  );

  const responseClass = await responseClassService.createResponseClass({
    name: responseClassName,
    description: responseClassDescription,
    featureId: featureId,
  });

  command.log(
    colorize(
      `\nResponse Class Details:\nName: ${responseClass.name}\nDescription: ${responseClass.description}\nFeature ID: ${responseClass.featureId}`,
      'green',
    ),
  );
}
