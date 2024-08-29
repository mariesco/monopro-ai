import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

async function checkPackage(expectedName, expectedCiScript) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const packagePath = path.join(__dirname, 'package.json');

  try {
    const packageData = await fs.readFile(packagePath, 'utf-8');
    const packageJson = JSON.parse(packageData);

    // Validate the package name
    if (packageJson.name !== expectedName) {
      console.error(
        `Error: The package name is "${packageJson.name}", but "${expectedName}" was expected.`,
      );
      process.exit(1);
    }

    console.log(`Package name is correct: ${packageJson.name}`);

    // Validate that the prepushOnly script contains the expected command
    const prepublishOnlyScript = packageJson.scripts?.prepublishOnly;

    if (
      !prepublishOnlyScript ||
      !prepublishOnlyScript.includes(expectedCiScript)
    ) {
      console.error(
        `Error: The prepublishOnly script does not contain "${expectedCiScript}".`,
      );
      process.exit(1);
    }

    console.log(
      `prepublishOnly script contains the correct command: ${expectedCiScript}`,
    );
  } catch (error) {
    console.error(`Error reading or processing package.json: ${error.message}`);
    process.exit(1);
  }
}

// Execute the function with specific parameters based on the environment
const expectedName = 'monopro-ai/cli';
const expectedCiScript = 'npm run ci:cli';

checkPackage(expectedName, expectedCiScript);
