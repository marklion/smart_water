import inquirer from 'inquirer';
function reg() {
    inquirer.prompt([
        {
            type: 'input',
            name: 'username',
            message: 'What is your username?'
        },
    ], function (result) {
        if (result.username != 'exit') {
            reg()
        }
        setTimeout(() => {
            re_load(result);
        }, 200)
    })
}
function re_load(result) {
    console.log(result);
}
reg()


