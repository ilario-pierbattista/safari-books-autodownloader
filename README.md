This is a kata.

# Login via ACM.org

Run the setup recipe, then edit the `.env` file with your actual secrets.

    make setup

Run the login script.

    npm run login

It will login to learning.oreilly.com using SSO with an ACM account.
Using [this procedure](https://github.com/lorenzodifuccia/safaribooks/issues/150#issuecomment-555423085) it will extract the `cookies.json` file and it will place it in the `safaribooks` submodule.


# Download books

The script wraps https://github.com/lorenzodifuccia/safaribooks.
It will do the actual download.