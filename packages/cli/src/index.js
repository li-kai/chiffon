"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var commander_1 = __importDefault(require("commander"));
var package_json_1 = __importDefault(require("../package.json"));
commander_1["default"].command('start <file>').action(function (dir, cmd) {
    console.log('remove ' + dir + (cmd.recursive ? ' recursively' : ''));
});
commander_1["default"].command('build <file>').action(function (dir, cmd) {
    console.log('remove ' + dir + (cmd.recursive ? ' recursively' : ''));
});
commander_1["default"].version(package_json_1["default"].version).parse(process.argv);
