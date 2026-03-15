const { updateUserRole, suspendUser, deleteUser, resetUserPassword, getUsers } = require('./src/app/lib/actions/user');
const { createUser } = require('./src/app/lib/actions/user');

async function test() {
    console.log(await getUsers());
}

test();
