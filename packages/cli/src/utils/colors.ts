export function colorize(
  text: string,
  color: 'red' | 'green' | 'yellow' | 'blue' | 'cyan',
): string {
  const colorCodes: { [key: string]: string } = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
  };

  return `${colorCodes[color]}${text}\x1b[0m`;
}
