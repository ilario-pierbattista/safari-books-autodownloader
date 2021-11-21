import { firefox } from 'playwright'
import * as E from 'fp-ts/Either'
import * as t from 'io-ts'
import { pipe } from 'fp-ts/lib/function'
import * as TE from 'fp-ts/TaskEither'
import * as O from 'fp-ts/Option'
import { writeFile } from 'fs/promises'
import { safariBooksModulePath } from 'src/utils'

interface Config {
    safariEmail: string
    acm: {
        username: string
        password: string
    }
}

interface AppError {
    type: 'config' | 'fs'
    message?: string
}

type cookies = Record<string, string>

function error(type: AppError['type'], message: AppError['message']): AppError {
    return { type, message }
}

function readConfigFromEnv(env: unknown): E.Either<AppError, Config> {
    const envConfigType = t.type({
        SAFARI_EMAIL: t.string,
        ACM_USERNAME: t.string,
        ACM_PASSWORD: t.string
    })

    return pipe(
        envConfigType.decode(env),
        E.bimap(
            _e => error('config', 'Unable to read config'),
            d => ({
                safariEmail: d.SAFARI_EMAIL,
                acm: {
                    username: d.ACM_USERNAME,
                    password: d.ACM_PASSWORD
                }
            })
        )
    )
}

pipe(
    process.env,
    readConfigFromEnv,
    TE.fromEither,
    TE.chain(
        config => {
            return TE.fromTask<cookies, AppError>(() => doLogin(config))
        }
    ),
    TE.chain(
        cookies => {
            return () => writeFile(
                safariBooksModulePath('cookies.json'),
                JSON.stringify(cookies)
            )
            .then(E.right)
            .catch(() => E.left(error('fs', 'Unable to write cookies file')))
        }
    )
)()

// Generate code with command
// npx playwright codegen https://www.oreilly.com/

async function doLogin(config: Config): Promise<cookies> {

    const browser = await firefox.launch({
        headless: true
    })
    const page = await browser.newPage()
    let requestCookies: O.Option<cookies> = O.none

    page.on(
        'request',
        async request => {
            if (request.url() !== 'https://learning.oreilly.com/profile/') {
                return;
            }

            const h = await request.allHeaders()

            requestCookies = pipe(
                t.type({cookie: t.string}).decode(h),
                E.map(d => {
                    // console.log(d.cookie)
                    let obj: cookies = {}

                    d.cookie.split(';').forEach(p => {
                        const parts = p.split('=') as [string, string]
                        obj[parts[0]] = parts[1]
                    })
                    return obj
                }),
                E.fold(
                    _ => O.none,
                    O.some
                )
            )
        }
    );

    // Go to https://www.oreilly.com/
    await page.goto('https://www.oreilly.com/');

    // Click text=Sign In
    await page.click('text=Sign In');
    await page.waitForLoadState();

    // Click [placeholder="Email Address"]
    await page.click('[placeholder="Email Address"]');

    // Fill [placeholder="Email Address"]
    await page.fill('[placeholder="Email Address"]', config.safariEmail);

    // Click [data-testid="EmailSubmit"]
    await Promise.all([
        page.waitForNavigation(/*{ url: 'https://idp.acm.org/idp/profile/SAML2/Redirect/SSO;jsessionid=node0dsof8sh0d2o0q6vz4y0kz4cm5777500.node0?execution=e1s1' }*/),
        page.click('[data-testid="EmailSubmit"]')
    ]);

    // Click [placeholder="Enter your username"]
    await page.click('[placeholder="Enter your username"]');

    // Fill [placeholder="Enter your username"]
    await page.fill('[placeholder="Enter your username"]', config.acm.username);

    // Click [placeholder="Enter your password"]
    await page.click('[placeholder="Enter your password"]');

    // Click [placeholder="Enter your password"]
    await page.click('[placeholder="Enter your password"]', {
        modifiers: ['Control']
    });

    // Fill [placeholder="Enter your password"]
    await page.fill('[placeholder="Enter your password"]', config.acm.password);

    // Click input:has-text("Sign in")
    await Promise.all([
        page.waitForNavigation(/*{ url: 'https://learning.oreilly.com/home/' }*/),
        page.click('input:has-text("Sign in")')
    ]);

    // Click [aria-label="Your profile"]
    await page.click('[aria-label="Your profile"]');

    // Click text=Profile
    await page.click('text=Profile');
    await page.waitForLoadState()

    await (() => setTimeout(() => Promise.resolve(), 1000))

    await browser.close()

    return pipe(
        requestCookies,
        O.getOrElse(() => ({}))
    )
}