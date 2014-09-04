/**
 * @namespace HP
 */

// Defining namespace HP before closure compiling may have serious consequences.
// e.g. HP.BaseClass may be treated as a single variable and renamed to a random name.
// We have to add the definition of HP after closure compiling through the wrapping task.
// var HP = {};