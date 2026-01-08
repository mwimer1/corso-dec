// scripts/utils/logger.ts
import chalk from 'chalk';

export const logger = {
  info: (message: string) => console.log(chalk.blue(message)),
  success: (message: string) => console.log(chalk.green(message)),
  warn: (message: string) => console.log(chalk.yellow(message)),
  error: (message: string, error?: Error | unknown) => {
    console.error(chalk.red(message));
    if (error instanceof Error) {
        console.error(chalk.red(error.message));
    } else if (error) {
        console.error(chalk.red(String(error)));
    }
  },
};

