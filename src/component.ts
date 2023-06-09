import { Application, Component, ControllerClass, CoreBindings, ServiceOrProviderClass, inject } from "@loopback/core";
import { SSOSettings } from "./settings";
import { EmailBindings, OTPBindings, PasswordHasherBindings, SMSBindings, SSOBindings, TokenServiceBindings, UserServiceBindings } from "./key";
import { EmailTemplate, ExtraField, OrgUserLink, Organisation, OrganisationInvitation, PasswordConfig, Role, User, UserCredentials, UserRoleMapping } from "./models";
import { BcryptHasher, InvitationService, JWTService } from "./services";
import { MyMyUserService, MyUserService } from "./services/user.service";
import { GroupInvitation } from "./models/group-invitation.model";
import { StaticRessource } from "./models/ressource.model";
import { EmailTemplateRepository, ExtraFieldRepository, OrgUserLinkRepository, OrganisationInvitationRepository, OrganisationRepository, RoleRepository, UserCredentialsRepository, UserRepository, UserRoleMappingRepository } from "./repositories";
import { DeviceController, InvitationController, OrgUserLinkOrganisationController, OrganisationController, RoleController, TemplateController, UserController, UserOrgUserLinkController } from "./controllers";
import { InfoController } from "./controllers/info.controller";

import { AuthFactorSender, EmailAuthFactor, SMSAuthFactor } from './services/auth-factor';
import { EmailSenderService } from "./services/email.service";
import { OrganisationService } from "./services/organisation.service";
import { RoleService } from "./services/role.service";


export class SSOApplicationComponent implements Component {

	models = [
		EmailTemplate,
		ExtraField,
		GroupInvitation,
		OrgUserLink,
		OrganisationInvitation,
		Organisation,
		StaticRessource,
		Role,
		UserRoleMapping,
		User,
		UserCredentials,
	];
	repositories = [
		EmailTemplateRepository,
		ExtraFieldRepository,
		OrgUserLinkRepository,
		OrganisationInvitationRepository,
		OrganisationRepository,
		RoleRepository,
		UserRoleMappingRepository,
		UserRepository,
		UserCredentialsRepository,
	];
	controllers?: ControllerClass[] | undefined = [
		DeviceController,
		InfoController,
		InvitationController,
		OrgUserLinkOrganisationController,
		OrganisationController,
		RoleController,
		TemplateController,
		UserOrgUserLinkController,
		UserController,
	];


  services?: ServiceOrProviderClass[] | undefined = [
    EmailAuthFactor,
    SMSAuthFactor,
    AuthFactorSender,
    EmailSenderService,
    InvitationService,
    JWTService,
    OrganisationService,
    RoleService,
    MyUserService
  ];


	constructor(
		@inject(CoreBindings.APPLICATION_INSTANCE) private app: Application,
	) {
		this.setUpBindings();
	}


  setUpBindings(): void {
    console.log('DB_URL', process.env.DB_URL);

    const settingsEnv = process.env.SSO_SETTINGS;
    let settings = new SSOSettings();
    if (settingsEnv) {
      settings = JSON.parse(settingsEnv);
    }
    this.app.bind(SSOBindings.SETTINGS).to(settings as any);

    const passwordConfigEnv = process.env.PASSWORD_CONFIG;
    let passwordConfig: PasswordConfig;
    if (!passwordConfigEnv) {
      passwordConfig = {
        max: 16,
        min: 8,
        symbol: false,
        upperLetter: true,
      };
    } else {
      passwordConfig = JSON.parse(passwordConfigEnv) as PasswordConfig;
    }

    this.app.bind(PasswordHasherBindings.PASSWORD_CONFIG).to(passwordConfig);

    this.app.bind('datasources.config.pgsql').to({
      name: 'pgsql',
      connector: 'postgresql',
      url: process.env.DB_URL ?? '',
    });

    this.app.bind(EmailBindings.TRANSPORTER).to({
      type: process.env.EMAIL_TYPE ?? 'smtp',
      host: process.env.EMAIL_HOST ?? 'smtp.sendgrid.net',
      port: process.env.EMAIL_PORT ?? 465,
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3',
      },
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    } as any);

    this.app.bind(EmailBindings.REDIRECT_EMAIL_VALIDATION).to(
      process.env.EMAIL_REDIRECT ?? '',
    );

    this.app.bind(EmailBindings.EMAIL_FROM).to(
      process.env.EMAIL_FROM ?? '"Default" <info@berlingoqc.com>',
    );

    this.app.bind(SMSBindings.SETTINGS).to({
      accountSid: process.env.SMS_SID ?? '',
      authToken: process.env.SMS_TOKEN ?? '',
      sendingNumber: process.env.SMS_NUMBER ?? '',
    });

    this.app.bind(OTPBindings.SECRET).to(process.env.OTP_SECRET ?? '');

    this.app.bind(TokenServiceBindings.TOKEN_SECRET).to(
      process.env.JWT_SECRET ?? '',
    );
    this.app.bind(TokenServiceBindings.TOKEN_EXPIRES_IN).to(
      process.env.JWT_TTL ?? '',
    );
    this.app.bind(TokenServiceBindings.TOKEN_SERVICE).toClass(JWTService);

    this.app.bind(PasswordHasherBindings.ROUNDS).to(10);
    this.app.bind(PasswordHasherBindings.PASSWORD_HASHER).toClass(BcryptHasher);
    this.app.bind(UserServiceBindings.USER_SERVICE).toClass(MyMyUserService);
  }
}
