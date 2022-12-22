import {
    IAppAccessors,
    IConfigurationExtend,
    IEnvironmentRead,
    ILogger,
    IHttp,
    IMessageBuilder,
    IRead,
    IPersistence,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IMessage, IPreMessageSentModify } from '@rocket.chat/apps-engine/definition/messages';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { SettingType } from '@rocket.chat/apps-engine/definition/settings';

export class GolinksApp extends App implements IPreMessageSentModify {
    private matcher: RegExp = /(go\/(\S+)?)/gi;

    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
        this.getLogger();
    }

    public async initialize(configurationExtend: IConfigurationExtend, environmentRead: IEnvironmentRead): Promise<void> {
        configurationExtend.settings.provideSetting({
            id: 'url',
            type: SettingType.STRING,
            packageValue: '',
            required: true,
            public: false,
            i18nLabel: 'Full URL of your shortlink service, e.g.: https://golinks.rocket.chat/',
        });

        await this.extendConfiguration(configurationExtend, environmentRead);
        this.getLogger().log('GoLinks App Initialized');
    }

    public async checkPreMessageSentModify(message: IMessage, read: IRead, http: IHttp): Promise<boolean> {
        if (typeof message.text !== 'string') {
            return false;
        }

        const result = message.text.match(this.matcher);

        return result ? result.length !== 0 : false;
    }

    public async executePreMessageSentModify(
        message: IMessage, builder: IMessageBuilder, read: IRead, http: IHttp, persistence: IPersistence): Promise<IMessage> {
        const msg = builder.getMessage();
        if (typeof msg.text !== 'string') {
            return await builder.getMessage();
        }

        const golinks = msg.text.match(this.matcher);
        if (golinks && golinks.length > 0) {
            const url = await read.getEnvironmentReader().getSettings().getById('url');
            if (url.value == null || url.value == '') {
                return await builder.getMessage();
            }

            const usedLinks: Set<string> = new Set();
            golinks.sort((a, b) => b.length - a.length);
            const uniqueGoLinks = [...new Set(golinks)];
            for (const link of uniqueGoLinks) {
                const parts = link.split('/');
                const endLink = parts.slice(1).join('/');

                const newLink = `[${link}](${url.value}${endLink})`
                const regex = new RegExp(link, 'g');
                msg.text = msg.text.replace(regex, (match, offset) => {
                    if (usedLinks.has(offset)) {
                        return match;
                    }

                    if (typeof msg.text !== 'string') {
                        return match;
                    }
                    if (offset - 1 >= 0 && msg.text[offset - 1] !== " ") {
                        // Return the original link if it is neither at the beginning nor preceded by a space.
                        return match;
                    }

                    usedLinks.add(offset);
                    return newLink;
                });
            }
            builder.setData(msg);
        }

        return await builder.getMessage();
    }

}
