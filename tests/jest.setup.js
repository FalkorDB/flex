/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

// tests/jest.setup.js
global.falkor = {
    register: jest.fn() // Using jest.fn() allows you to track if it was called
};
