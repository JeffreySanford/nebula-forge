# Resolving Dependency Issues in Nebula Forge

## Node.js Version Update

The project requires Node.js `v18.19.1`, `v20.11.1`, or `>=v22.0.0`. Your current version (`v20.9.0`) is causing compatibility warnings. To fix this:

Using nvm (recommended):
```bash
nvm install 20.11.1
nvm use 20.11.1
```

Or download the appropriate version from [nodejs.org](https://nodejs.org/).

## Apollo GraphQL Packages

Many Apollo Server packages are deprecated. The project should migrate from Apollo Server v3 to v4:

1. Remove deprecated packages:
```bash
npm uninstall apollo-server-core apollo-server-express apollo-server-plugin-base apollo-server-types apollo-reporting-protobuf apollo-server-env apollo-datasource apollo-server-errors subscriptions-transport-ws
```

2. Install updated packages:
```bash
npm install @apollo/server @apollo/usage-reporting-protobuf @apollo/utils.fetcher @apollo/datasource-base graphql-ws
```

3. Update your code to use the new imports and APIs. See the [Apollo migration guide](https://www.apollographql.com/docs/apollo-server/migration/).

## Security Vulnerabilities

To fix security vulnerabilities:
```bash
npm audit fix --force
```

Note: This may update packages to versions with breaking changes. Test your application thoroughly after this update.

## Additional Deprecated Packages

Consider updating these other deprecated packages:
- Replace `rimraf` with newer versions (v4+) or native `fs.rm`
- Replace `read-package-json` with `@npmcli/package-json`
- Replace `abab` with native `atob()` and `btoa()` methods
- Replace `domexception` with native `DOMException`
- Replace `inflight` with `lru-cache`
- Replace `glob@7.2.3` with `glob@9+`

For a more automated approach, run the provided script:
```bash
node scripts/fix-dependencies.js
```
