import { AppService } from '../src/app.service.js';

describe('AppService', () => {
  it('answers the health greeting', () => {
    expect(new AppService().getHello()).toBe('Hello World!');
  });
});
