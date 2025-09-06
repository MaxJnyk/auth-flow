Создать .npmrc в проекте где будет использоваться пакет, в переменной GITLAB_NPM_TOKEN указать значение

@common:registry=https://gitlab.com/api/v4/projects/101/packages/npm/
//gitlab.com/api/v4/projects/101/packages/npm/:\_authToken=${GITLAB_NPM_TOKEN}
