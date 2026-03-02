import { MailerOptions } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';

// En dev Docker le volume monte le source ; en prod le build copie les assets dans dist
const templatesDir =
  join(process.cwd(), 'src', 'mail', 'templates');

export const mailConfig: MailerOptions = {
  transport: {
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT || '587', 10),
    secure: false,
    auth:
      process.env.MAIL_USER && process.env.MAIL_PASSWORD
        ? {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASSWORD,
          }
        : undefined,
  },
  defaults: {
    from: `"EventNow" <${process.env.MAIL_FROM || 'noreply@eventnow.com'}>`,
  },
  template: {
    dir: templatesDir,
    adapter: new HandlebarsAdapter(),
    options: {
      strict: true,
    },
  },
};
