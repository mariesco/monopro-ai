export function buildSingleResponseGenerationPrompt(useCase: {
  promptId: number;
  useCaseId: number;
  promptContent: string;
  caseDescription: string;
}): string {
  return `Genera una respuesta para el siguiente caso de uso utilizando el prompt proporcionado:

    Prompt ID ${useCase.promptId}: ${useCase.promptContent}

    Caso de uso ID ${useCase.useCaseId}: ${useCase.caseDescription}

    Genera una respuesta para este caso de uso. Formato: Devuelve el resultado como un objeto JSON con la siguiente estructura:
    {
    "success": true,
    "value": {
        "promptId": ${useCase.promptId},
        "useCaseId": ${useCase.useCaseId},
        "generatedResponse": "Tu respuesta generada aquí"
    }
    }`;
}
