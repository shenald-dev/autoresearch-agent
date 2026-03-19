module.exports = {
  intro: jest.fn(),
  outro: jest.fn(),
  spinner: () => ({ start: jest.fn(), stop: jest.fn() }),
  text: jest.fn(),
  password: jest.fn(),
  select: jest.fn(),
  cancel: jest.fn(),
  isCancel: jest.fn(),
  log: { warn: jest.fn(), step: jest.fn(), message: jest.fn(), error: jest.fn() }
};
