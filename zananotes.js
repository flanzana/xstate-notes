import { Machine, interpret, assign, send } from 'xstate'

// examples are from Introduction to State Machines Using XState course on https://egghead.io/courses/introduction-to-state-machines-using-xstate

const lightBulbMachine = Machine(
  {
    id: 'lightBulb', // unique for each machine
    initial: 'unlit', // initial state
    states: {
      // object with info of each state
      lit: {
        // With state machines, we trigger transitions through events, and we define
        // which state nodes respond to which events. We'll do this by adding an on
        // property to the state nodes that should respond to events.
        on: {
          // BREAK = name of the event, convention to be uppercase
          // 'broken' = state we would like to transition to
          BREAK: 'broken',
          // can be written like this too, it is the same:
          // BREAK: { target: 'broken' },
          TOGGLE: 'unlit',
        },
        // action happens when you leave/exit state. it does not matter if we go later to broken or unlit state.
        exit: () => {
          console.log('it is dark')
        },
      },
      unlit: {
        on: {
          BREAK: {
            target: 'broken', // target next state
            // actions: [(context, event) => { console.log(context, event)}]
            // actions: [() => { console.log('i am broke')}] // this can be moved down to actions object
            // actions: ['logBroken'], // it's beter to get this action when we enter broken state
          },
          TOGGLE: 'lit',
        },
      },
      broken: {
        // when object is empty (broken: {}), it means it's a final state of our machine. You can also add type: final to object
        type: 'final',
        // action happens when you enter state
        entry: ['logBroken', 'buyANewBulb'],
      },
    },
    strict: true, // throws error if we use unknown event in transition function
  },
  {
    actions: {
      logBroken: (context, event) => {
        // we can pass some addition info on each send in Event object, like service.send({ type: 'BREAK', location: 'office' })
        console.log(`i am broke in ${event.location}`)
      },
      buyANewBulb: (context, event) => {
        console.log('buy a new bulb')
      },
    },
  }
)

// // initial state
// console.log(lightBulbMachine.initialState)

// // when you pass unknown event, machine returns same state. It throws error when you add strict: true.
// console.log(lightBulbMachine.transition('unlit', 'FOO').value)

// console.log(lightBulbMachine.transition('unlit', 'TOGGLE').value)
// console.log(lightBulbMachine('unlit', 'BREAK'))
// console.log(lightBulbMachine('broken', 'TOGGLE'))

const lightBulbService = interpret(lightBulbMachine).start()

// onTransition takes listener function that receives a state argument.
lightBulbService.onTransition((state) => {
  console.log(state.value)
})

lightBulbService.send('TOGGLE')
lightBulbService.send('TOGGLE')
lightBulbService.send('BREAK')

const idleMachine = Machine(
  {
    id: 'idle',
    initial: 'idle',
    states: {
      idle: {
        entry: ['logEntry'],
        exit: ['logExit'],
      },
    },
    on: {
      DO_NOTHING: '.idle', // dot = it won't leave the state (it won't log entered and exited actions)
    },
  },
  {
    actions: {
      logEntry: () => {
        console.log('entered')
      },
      logExit: () => {
        console.log('exited')
      },
    },
  }
)

const multiColoredBulbMachine = Machine(
  {
    id: 'multiColoredBulb',
    initial: 'unlit',
    // context is extended state
    context: {
      color: '#fff', // initial color
    },
    states: {
      lit: {
        // activities = what is happening when we are in the state (ongoing side effects),
        // for example light is blinking.
        // It starts when we enter and it stops when we exit.
        activities: ['blinking'],
        on: {
          BREAK: 'broken',
          TOGGLE: 'unlit',
          CHANGE_COLOR: {
            // it has no target because we don't want to transition to another state, it only updates context
            actions: ['changeColor'],
          },
        },
      },
      unlit: {
        on: {
          BREAK: 'broken',
          TOGGLE: 'lit',
        },
      },
      broken: { type: 'final' },
    },
  },
  {
    actions: {
      // assign will update values in context object
      changeColor: assign({
        // color: '#f00', // it can update it directly or via function as line below
        color: (context, event) => event.color,
      }),
    },
    activities: {
      blinking: (context, event) => {
        const blink = () => {
          console.log('i am blinking')
        }

        blink()
        const intervalID = setInterval(blink, 1000) // blink every second
        // this will clean up blinking once we change to different state (without this, it would blink even in unlit or broken state)
        return () => clearInterval(intervalID)
      },
    },
  }
)

const multiColoredBulbService = interpret(multiColoredBulbMachine).start()
multiColoredBulbService.send({ type: 'CHANGE_COLOR', color: '#00F' }) // updates color in context to blue

const vendingMachineMachine = Machine(
  {
    id: 'vendingMachine',
    initial: 'idle',
    context: {
      deposited: 0,
    },
    states: {
      idle: {
        on: {
          SELECT_ITEM: {
            target: 'vending',
            // cond is a condition. if the condition is not meet (not true),
            // then this event is disabled. Once condition is met, then event
            // becomes enabled again.
            // For example we don't want to allow selecting an item without insterting the money first.
            cond: 'isDepositedEnough',
          },
          DEPOSIT_QUARTER: {
            actions: ['addQuarter'],
          },
        },
      },
      vending: {},
    },
  },
  {
    actions: {
      addQuarter: assign({
        deposited: (context) => context.deposited + 25,
      }),
    },
    guards: {
      // it should always return boolean true/false!!
      isDepositedEnough: (context) => context.deposited >= 100,
    },
  }
)

// Door can have 2 states at the same time: locked+closed or unlocked+closed.
// But when door is opened, it is always unlocked, never locked.
const doorMachine = Machine({
  id: 'door',
  initial: 'locked',
  states: {
    locked: {
      id: 'locked', // this is needed when we want to transition from level below using LOCK: '#locked'
      on: { UNLOCK: 'unlocked' },
    },
    unlocked: {
      initial: 'closed',
      // hierarchical states of the event
      states: {
        closed: {
          on: {
            // # = to go back to locked on level up in previous hierarhy.
            LOCK: '#locked', // in case we have id for locked event, otherwise we can do LOCK: '#door.locked',
            OPEN: 'opened',
          },
        },
        opened: {
          on: { CLOSE: 'closed' },
        },
      },
    },
  },
})

const spaceHeaterMachine = Machine({
  id: 'spaceHeater',
  initial: 'poweredOff',
  states: {
    poweredOff: {
      on: {
        TOGGLE_POWER: 'poweredOn.hist', // because we use hist in poweredOn state, we need to append .hist here. Without append it won't remember last states.
      },
    },
    poweredOn: {
      // initial: 'lowHeat',
      // states: {
      //   lowHeat: {
      //     on: { TOGGLE_HEAT: 'lowHeat' },
      //   },
      //   highHeat: {
      //     on: { TOGGLE_HEAT: 'highHeat' },
      //   },
      //   if we weren't in parallel mode, hist would be located here:
      //   hist: {
      //     type: 'history',
      //   },
      //   // oscillation??? oscillating is really the state of the space heater that happens in parallel to the heating of the space heater
      // },
      on: {
        TOGGLE_POWER: 'poweredOff',
      },
      type: 'parallel', // when parallel, we don't provide initial for poweredOn since it's in each state all at the same time
      // we will be in heated and oscillation state at the same time.
      // When we change state in one of them (heated), state is not affected in another one (oscillation), and vice versa.
      states: {
        heated: {
          initial: 'lowHeat',
          states: {
            lowHeat: {
              on: { TOGGLE_HEAT: 'highHeat' },
            },
            highHeat: {
              on: { TOGGLE_HEAT: 'lowHeat' },
            },
          },
        },
        oscillation: {
          initial: 'disabled',
          states: {
            disabled: {
              on: { TOGGLE_OSC: 'enabled' },
            },
            enabled: {
              on: { TOGGLE_OSC: 'disabled' },
            },
          },
        },
        // history will remember what state we were in when we transitioned to poweredOff state
        hist: {
          type: 'history',
          history: 'deep', // deep = it will remember states of all parallel states. By default it is set to 'shadow' = won't remember in paralel case.
        },
      },
    },
  },
})

const tryTryAgainMachine = Machine(
  {
    id: 'tryTryAgain',
    initial: 'idle',
    context: {
      tries: 0,
    },
    states: {
      idle: {
        on: { TRY: 'trying' },
      },
      trying: {
        entry: ['incTries'],
        on: {
          // '' is null event = A null event is immediately taken when we enter a state. That's called a transient transition.
          // Every time I enter trying, I'm going to immediately take the transitions I have here.
          '': [
            { target: 'success', cond: 'enoughTries' }, // transition to success when tried enough times
            { target: 'idle' },
          ],
        },
      },
      success: {},
    },
  },
  {
    actions: {
      incTries: assign({
        tries: (context) => context.tries + 1,
      }),
    },
    guards: {
      enoughTries: (context) => context.tries >= 3,
    },
  }
)

// static delays
const stopLightMachine1 = Machine({
  id: 'stopLight',
  initial: 'red',
  states: {
    red: {
      // when using after, event should be a number in miliseconds = how long the state lasts, then we set up next state
      after: { 4000: 'yellow' },
    },
    yellow: {
      after: { 1000: 'green' },
    },
    green: {
      after: { 3000: 'red' },
    },
  },
})

// delays in the `options` object
const stopLightMachine2 = Machine(
  {
    id: 'stopLight',
    initial: 'red',
    states: {
      red: {
        after: { RED_TIMER: 'yellow' },
      },
      yellow: {
        after: { YELLOW_TIMER: 'green' },
      },
      green: {
        after: { GREEN_TIMER: 'red' },
      },
    },
  },
  {
    // when using delays object, we can replace number in states to those enums
    delays: {
      RED_TIMER: 4000, // can be number or a function accepting context and event (incase we want to add rush time (example in machine below))
      YELLOW_TIMER: 1000,
      GREEN_TIMER: 3000,
    },
  }
)

// dynamic delays
const stopLightMachine3 = Machine(
  {
    id: 'stopLight',
    initial: 'red',
    context: {
      rushHourMultiplier: 1,
    },
    // onEvent on top level of our machine will update any of the states that we're in
    on: {
      INC_RUSH_HOUR: {
        actions: ['incRushHour'],
      },
    },
    states: {
      red: {
        after: { RED_TIMER: 'yellow' },
      },
      yellow: {
        after: { YELLOW_TIMER: 'green' },
      },
      green: {
        after: { GREEN_TIMER: 'red' },
      },
    },
  },
  {
    actions: {
      incRushHour: assign({
        rushHourMultiplier: (ctx) => ctx.rushHourMultiplier + 1,
      }),
    },
    delays: {
      RED_TIMER: (context) => context.rushHourMultiplier * 4000,
      YELLOW_TIMER: (context) => context.rushHourMultiplier * 1000,
      GREEN_TIMER: (context) => context.rushHourMultiplier * 3000,
    },
  }
)

const fetchCuteAnimals = () => {
  return fetch('https://www.reddit.com/r/aww.json')
    .then((res) => res.json())
    .then((data) => data.data.children.map((child) => child.data))
}
const cuteAnimalMachine = Machine({
  id: 'cuteAnimals',
  initial: 'idle',
  context: {
    cuteAnimals: null,
    error: null,
  },
  states: {
    idle: {
      on: { FETCH: 'loading' },
    },
    loading: {
      // this will invoke our promise fetchCuteAnimals
      invoke: {
        id: 'fetchCuteAnimals',
        src: fetchCuteAnimals,
        // when promise resolves, it responds to onDone event
        onDone: {
          target: 'success',
          actions: [
            assign({
              cuteAnimals: (context, event) => event.data,
            }),
          ],
        },
        // when promise rejects, it responds to onError event
        onError: {
          target: 'failure',
          actions: [
            assign({
              error: (context, event) => event.data,
            }),
          ],
        },
      },
    },
    success: {
      type: 'final',
    },
    failure: {
      on: {
        RETRY: 'loading',
      },
    },
  },
})

const echoCallbackHandler = (context, event) => (callback, onEvent) => {
  // responds to any event
  onEvent((e) => {
    // // this responds to any event
    // callback('ECHO')

    // this resonds to only specific event HEAR. We have to send it as actions: send('HEAR', { to: 'echoCallback' }),
    if (e.type === 'HEAR') {
      callback('ECHO')
    }
  })
}
// The idea of this machine is when the event speak is called, I want to set up a callback that'll send
// Echo events back to my machine if, and only if, the right type of event is sent. We can do this by
// invoking a callback as a service.
const echoMachine = Machine({
  id: 'echo',
  initial: 'listening',
  states: {
    listening: {
      invoke: {
        id: 'echoCallback',
        src: echoCallbackHandler,
      },
      on: {
        SPEAK: {
          // object where do we send (to id of my callback service, echoCallback)
          actions: send('FOO', { to: 'echoCallback' }),
        },
        ECHO: {
          actions: () => {
            console.log('echo, echo')
          },
        },
      },
    },
  },
})

// Invoke Child XState Machines from a Parent Machine
// visualizer is not able to display child yet

const childMachine = Machine({
  id: 'child',
  initial: 'step1',
  states: {
    step1: {
      on: { STEP: 'step2' },
    },
    step2: {
      on: { STEP: 'step3' },
    },
    step3: {
      type: 'final',
    },
  },
})

const parentMachine = Machine({
  id: 'parent',
  initial: 'idle',
  states: {
    idle: {
      on: { ACTIVATE: 'active' },
    },
    active: {
      // this can invoke child machine
      invoke: {
        id: 'child',
        src: childMachine,
        onDone: 'done', // onDone is triggered when the child reaches final state. We want to go to 'done' state of the parent
      },
      // I'd like to have an action occurred in this active event, which is I want to send a step event to my child machine
      on: {
        STEP: {
          actions: send('STEP', { to: 'child' }),
        },
      },
    },
    done: {},
  },
})

// invoke can be used for promise, callback or invoking a child machine
