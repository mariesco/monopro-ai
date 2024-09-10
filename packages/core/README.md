# MonoPro [On beta testing]

MonoPro is the **first tool designed to help teams create powerful AI-experiences**, with a focus on building **robust**, **scalable applications**. Whether you're integrating simple AI features or managing complex models, MonoPro gives you complete control over how your models perform across all use cases. With features like **real-time metrics**, **model branching**, and **fine-tuning**, MonoPro ensures clarity and confidence in how your AI behaves in local, QA, and production environments. This is the tool your team needs to build AI-driven solutions that scale with precision and reliability.

It consists of two main packages: `monopro-core` and `monopro-cli`. MonoPro allows developers to run local tests, track metrics, perform model branching, and apply fine-tuning to AI models, such as those integrated with the _Vercel AI SDK_.

## Table of Contents

- [When to use](#when-to-use)
- [Packages](#packages)
- [Key Features](#key-features)
- [Installation](#installation)
- [Contributing](#contributing)
- [License](#license)

## When to use

MonoPro is designed to support teams at various stages of AI integration, from initial development to scaling and optimization. You should consider using MonoPro in the following scenarios:

- **Ensuring Model Effectiveness**: If clients or stakeholders ask how you ensure the effectiveness of the AI models integrated into your application, MonoPro provides tools for generating real-time metrics and detailed insights to give you confidence in the model’s performance.
- **Measuring Model Performance**: When you need to track the accuracy, precision, or overall performance of your AI models, MonoPro helps you visualize key metrics, giving you clear data on how the model behaves in different environments (local, QA, production).
- **Modifying Integrated Models**: When changes or updates to your AI model are required (fine-tuning or branching), MonoPro simplifies the process of updating or altering models already integrated into your applications without disrupting production environments.
- **Scaling AI Solutions**: As your AI-powered product grows, MonoPro assists in managing model versions, performance, and branching, ensuring that scaling your application doesn’t introduce technical debt or uncertainties in your AI behavior.
- **Debugging and Testing AI Features**: If you’re in a development or QA phase, MonoPro allows you to test your AI models under various conditions, ensuring their reliability before going live in production.
- **Client Demos and Confidence**: When demonstrating your AI-powered solution to clients, MonoPro’s robust metrics and model management tools allow you to clearly show how the AI is performing and how changes are made, instilling confidence in your team’s ability to maintain and optimize the AI model over time.
- **Continuous Monitoring in Production**: For teams running AI models in production, MonoPro provides continuous monitoring and metric tracking to detect any unexpected behaviors or performance issues, ensuring that the AI remains effective and reliable post-launch.

## Packages

### 1. monopro-ai [core]

The core of the system, which handles the main functionalities for AI integration in your application. It provides tools to manage datasets, run tests, and monitor the metrics of deployed models.

### 2. monopro-ai-cli [cli]

A command-line interface that facilitates interaction with the `monopro-core` features. It allows you to run operations quickly and efficiently across local, QA, and production environments.

## Key Features

- **Local Testing**: Run tests cases directly in your development environment to measure the impact of ai features in your project.
- **Real-time Metrics**: Generate and view detailed metrics about your AI implementation.
- **Model Branching**: Manage different versions of your models, allowing you to work with multiple branches in parallel.
- **Fine-Tuning**: Adjust your AI models and continuously test and optimize performance.
- **Vercel AI Integration**: Easily integrate and manage Vercel SDK's AI capabilities in your product.

## Installation

The installation of MonoPro depends on your specific use case:

### For local testing or QA environment

1. Install the CLI globally:

```bash
npm install -g monopro-ai-cli
```

2. Configure the NEON_URL environment variable:

```bash
export NEON_URL="your_neon_db_url"
```

Or set the NEON_URL environment variable in your `.env` file.

3. Run the migrations:

```bash
monopro migrate
```

4. Start to use:

```bash
monopro menu
```

### For production environment

1. Install the monopro-ai package:

```bash
npm install monopro-ai
```

2. Configure the NEON_URL environment variable in your '.env' file:

```bash
NEON_URL="your_neon_db_url"
```

3. Add your MonoproWatcher to your service:

```typescript
const watcher = new MonoproWatcher();

// ... your AI implementation here ...

await watcher.observe({ prompt: '...', response: '...' });
```

4. Create one new route to return MonoproView:

```typescript
app.get('/monopro', async (req, res) => {
  return MonoproView(req, res);
});
```

5. Start your application and navigate to the Monopro route to view the metrics.

## Contributing

We welcome contributions to MonoPro! If you have any ideas or suggestions, please open an issue or submit a pull request.

## License

MIT License

Copyright (c) 2024 Martín Riesco
