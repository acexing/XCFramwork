import { _decorator, Component, Label, Node, Color } from 'cc';
import { EventBus } from '../services/EventBus';
import { Logger } from '../core/logger/Logger';
import { LogLevel } from '../core/interfaces/ILogger';
import { ServiceRegistry } from '../app/ServiceRegistry';
import { SERVICE_TOKENS } from '../core/interfaces/ServiceTokens';

const { ccclass, property } = _decorator;

interface TestCase {
  name: string;
  fn: () => void;
}

@ccclass('TestRunner')
export class TestRunner extends Component {
  @property({ type: Label, tooltip: '测试结果显示' })
  public resultLabel: Label | null = null;

  @property({ type: Node, tooltip: '详细日志节点' })
  public logNode: Node | null = null;

  private passedCount: number = 0;
  private failedCount: number = 0;
  private logger: Logger = new Logger(false);

  onLoad(): void {
    this.logger.setLevel(LogLevel.None);
    this.runAllTests();
  }

  private runAllTests(): void {
    this.passedCount = 0;
    this.failedCount = 0;

    const tests: TestCase[] = [
      { name: 'EventBus - on/emit', fn: () => this.testOnEmit() },
      { name: 'EventBus - once', fn: () => this.testOnce() },
      { name: 'EventBus - off by handler', fn: () => this.testOffByHandler() },
      { name: 'EventBus - off by target', fn: () => this.testOffByTarget() },
      { name: 'EventBus - offByTarget', fn: () => this.testOffByTargetMethod() },
      { name: 'EventBus - duplicate subscription', fn: () => this.testDuplicateSubscription() },
      { name: 'EventBus - hasListener', fn: () => this.testHasListener() },
      { name: 'EventBus - clear', fn: () => this.testClear() },
      { name: 'EventBus - emit no listeners', fn: () => this.testEmitNoListeners() },
      { name: 'EventBus - handler exception isolation', fn: () => this.testHandlerException() },
      { name: 'EventBus - multiple handlers', fn: () => this.testMultipleHandlers() },
      { name: 'EventBus - once and on mix', fn: () => this.testOnceAndOnMix() },
      { name: 'ServiceRegistry - register/get', fn: () => this.testServiceRegistry() },
    ];

    for (const test of tests) {
      this.runTest(test);
    }

    this.showResults();
  }

  private runTest(test: TestCase): void {
    try {
      test.fn();
      this.passedCount++;
      this.log(`✓ ${test.name}`, true);
    } catch (error) {
      this.failedCount++;
      const msg = error instanceof Error ? error.message : String(error);
      this.log(`✗ ${test.name}: ${msg}`, false);
    }
  }

  private assert(condition: boolean, message: string): void {
    if (!condition) {
      throw new Error(message);
    }
  }

  private assertEqual(actual: unknown, expected: unknown, message: string): void {
    if (actual !== expected) {
      throw new Error(`${message} (expected: ${expected}, actual: ${actual})`);
    }
  }

  private testOnEmit(): void {
    const bus = new EventBus(this.logger);
    let received: unknown = null;

    bus.on('test_event', (data: unknown) => {
      received = data;
    });

    bus.emit('test_event', { value: 42 });
    this.assert(received !== null, 'handler should be called');
    this.assertEqual((received as Record<string, number>).value, 42, 'data should match');
  }

  private testOnce(): void {
    const bus = new EventBus(this.logger);
    let callCount = 0;

    bus.once('once_event', () => {
      callCount++;
    });

    bus.emit('once_event');
    bus.emit('once_event');
    this.assertEqual(callCount, 1, 'once handler should only be called once');
    this.assert(!bus.hasListener('once_event'), 'once listener should be removed');
  }

  private testOffByHandler(): void {
    const bus = new EventBus(this.logger);
    let callCount = 0;

    const handler = () => {
      callCount++;
    };

    bus.on('off_event', handler);
    bus.off('off_event', handler);
    bus.emit('off_event');
    this.assertEqual(callCount, 0, 'handler should not be called after off');
  }

  private testOffByTarget(): void {
    const bus = new EventBus(this.logger);
    let callCount = 0;

    const target = { id: 'target1' };
    bus.on(
      'off_target_event',
      () => {
        callCount++;
      },
      target
    );

    bus.off('off_target_event', undefined, target);
    bus.emit('off_target_event');
    this.assertEqual(callCount, 0, 'handler should not be called after off by target');
  }

  private testOffByTargetMethod(): void {
    const bus = new EventBus(this.logger);
    let callCount = 0;

    const target = { id: 'target2' };
    bus.on(
      'event_a',
      () => {
        callCount++;
      },
      target
    );
    bus.on(
      'event_b',
      () => {
        callCount++;
      },
      target
    );

    bus.offByTarget(target);
    bus.emit('event_a');
    bus.emit('event_b');
    this.assertEqual(callCount, 0, 'all handlers for target should be removed');
  }

  private testDuplicateSubscription(): void {
    const bus = new EventBus(this.logger);
    let callCount = 0;

    const handler = () => {
      callCount++;
    };

    bus.on('dup_event', handler);
    bus.on('dup_event', handler);

    bus.emit('dup_event');
    this.assertEqual(callCount, 1, 'duplicate handler should be ignored');
  }

  private testHasListener(): void {
    const bus = new EventBus(this.logger);

    this.assert(!bus.hasListener('no_listeners'), 'should return false for no listeners');

    bus.on('has_event', () => {});
    this.assert(bus.hasListener('has_event'), 'should return true when listeners exist');

    bus.off('has_event');
    this.assert(!bus.hasListener('has_event'), 'should return false after off');
  }

  private testClear(): void {
    const bus = new EventBus(this.logger);

    bus.on('clear_event', () => {});
    bus.on('another_event', () => {});
    bus.clear();
    this.assert(!bus.hasListener('clear_event'), 'should not have listeners after clear');
    this.assert(!bus.hasListener('another_event'), 'all events should be cleared');
  }

  private testEmitNoListeners(): void {
    const bus = new EventBus(this.logger);
    bus.emit('no_listeners_event', { data: 'test' });
    this.assert(true, 'emit with no listeners should not throw');
  }

  private testHandlerException(): void {
    const bus = new EventBus(this.logger);
    let secondCalled = false;

    bus.on('error_event', () => {
      throw new Error('handler error');
    });
    bus.on('error_event', () => {
      secondCalled = true;
    });

    bus.emit('error_event');
    this.assert(secondCalled, 'second handler should still be called after first throws');
  }

  private testMultipleHandlers(): void {
    const bus = new EventBus(this.logger);
    let count1 = 0;
    let count2 = 0;

    bus.on('multi_event', () => {
      count1++;
    });
    bus.on('multi_event', () => {
      count2++;
    });

    bus.emit('multi_event');
    this.assertEqual(count1, 1, 'first handler called');
    this.assertEqual(count2, 1, 'second handler called');

    bus.emit('multi_event');
    this.assertEqual(count1, 2, 'first handler called again');
    this.assertEqual(count2, 2, 'second handler called again');
  }

  private testOnceAndOnMix(): void {
    const bus = new EventBus(this.logger);
    let onceCount = 0;
    let onCount = 0;

    bus.once('mix_event', () => {
      onceCount++;
    });
    bus.on('mix_event', () => {
      onCount++;
    });

    bus.emit('mix_event');
    this.assertEqual(onceCount, 1, 'once handler called first time');
    this.assertEqual(onCount, 1, 'on handler called first time');

    bus.emit('mix_event');
    this.assertEqual(onceCount, 1, 'once handler not called second time');
    this.assertEqual(onCount, 2, 'on handler called second time');
  }

  private testServiceRegistry(): void {
    ServiceRegistry.clear();
    const testService = { name: 'test' };
    ServiceRegistry.register(SERVICE_TOKENS.LOGGER, testService);

    const retrieved = ServiceRegistry.get(SERVICE_TOKENS.LOGGER);
    this.assertEqual(retrieved, testService, 'registered service should be retrievable');

    ServiceRegistry.unregister(SERVICE_TOKENS.LOGGER);
    let threw = false;
    try {
      ServiceRegistry.get(SERVICE_TOKENS.LOGGER);
    } catch {
      threw = true;
    }
    this.assert(threw, 'get after unregister should throw');
  }

  private log(message: string, isPass: boolean): void {
    if (this.logNode) {
      const labelNode = new Node('TestLog');
      this.logNode.addChild(labelNode);
      const label = labelNode.addComponent(Label);
      label.fontSize = 14;
      label.string = message;
      label.color = isPass ? new Color(0, 255, 0, 255) : new Color(255, 0, 0, 255);
    }
  }

  private showResults(): void {
    const summary = `${this.passedCount} passed, ${this.failedCount} failed`;
    if (this.resultLabel) {
      this.resultLabel.string = summary;
      this.resultLabel.color =
        this.failedCount === 0 ? new Color(0, 255, 0, 255) : new Color(255, 0, 0, 255);
    }
    console.log(`[TestRunner] ${summary}`);
  }
}
