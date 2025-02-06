import moduleAlias from 'module-alias';
import path from 'path';

moduleAlias.addAliases({
    "@": path.resolve(__dirname, '..'),
});