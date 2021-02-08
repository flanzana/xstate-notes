# Basics of XState

## Resources

- [course Introduction to State Machines Using XState](https://egghead.io/courses/introduction-to-state-machines-using-xstate)
- [repo Introduction to State Machines Using XState](https://github.com/kyleshevlin/intro-to-state-machines-and-xstate-course)
- [XState docs](https://xstate.js.org/docs/)
- [XState visualizer](https://xstate.js.org/viz/)

## Summaries of course's lessons

Descriptions are copied from each lessons's README from [Introduction to State Machines Using XState](https://github.com/kyleshevlin/intro-to-state-machines-and-xstate-course) repo, in order to have all of them at one place.

### Eliminate Boolean Explosion by Enumerating States

There are several fundamental problems with trying to manage the state of a function through the use of booleans. The first is often referred to as "boolean explosion". For every boolean we add to a function, we increase the number of possible states at a rate of `2^n` where `n` is the number of booleans. Running the math just a few times quickly reveals an absurd amount of states.

- 1 booleans = 2 states
- 2 booleans = 4 states
- 3 booleans = 8 states
- 4 booleans = 16 states
- 5 booleans = 32 states!

The second problem with managing state with booleans is that many of these states are "impossible states", states our application should never be in. The example in the lesson is that the light bulb should not be `isLit` and `isBroken`. It's simply not possible, and is an inaccurate modeling of an actual light bulb.

### Replace Enumerated States with a State Machine

Enumerating the possible states of a function is a sound way to write a function, but it is imperative and could benefit from abstraction. We can do this with a state machine.

A state machine formalizes how we enumerate states and transitions. For the sake of clarity and to emphasize the core concepts, I will be overly verbose with my code in this lesson.

In this lesson, we'll replace the state enum with individual state objects. We'll also replace our events `toggle()` and `break()` with events `TOGGLE` and `BREAK`. I'll also demonstrate the usefulness of the Machine's `initialState` getter and the `transition` method. Lastly, I'll show what happens when we pass erroneous states or events into our machine.

### Use an Interpreter to Instantiate a Machine

While it's powerful enough to have `Machine.transition`, it can get tedious constantly passing it a state and an event. It would be nice if we had a function that could take a machine, instantiate it, maintain the state of the machine, and give us the ability to send events to it.

This is where an interpreter comes in handy.

And interpreter takes the abstract machine and brings it to life. XState provides us a function, `interpret`, to do this. `interpret` returns to us a service and we can use that service to send events, subscribe to changes, and add callbacks to events such as `onTransition`

### Use XState Viz to Visually Develop and Test Your Machine

XState Viz is an online tool for visualizing our state machines. It allows you to write any state machine in the code panel on the right, and see it visualized on the left. Not only is the visualization helpful, but it is interactive. We're able to test out our machine manually by clicking the various events on the left. Anything lit blue is available for clicking. As we go further in the course, we'll discover other features of the visualization.

There are two other tabs on the right panel that are useful to us. The first is that "state" tab. This tab gives us information regarding the current state of our machine. It provides us an object with the value. If we had context, actions and more, it would show that information as well.

The second tab is the event tab. We are able to call events here as well. Anything available to the current state node is made into a button here on the bottom right. What is useful about this panel is that we can pass along extra information on our events than we can with just a string to represent our transition target. If I wanted to share the location of the lightBulb for example, that could be passed along the broken event.

We can see a history of the events sent above this part of the panel, and we can replay or edit them if we would like.

Lastly, if we are logged in, we can save our machine definition as a gist. Notice that the URL has appended a gist query param. This is the id of our gist. We can see it by going to gist.github.com/username/id

### Add Actions to Transitions to Fire Side Effects

Actions are "fire-and-forget" side effects that are triggered by transitions. We set functions on a transition object's `actions` property to have them called when a transition is taken.

```javascript
//...
EVENT_NAME: {
  target: 'name-of-state-to-transition-to',
  actions: [(context, event) => { sideEffectToFire(context, event) }]
}
//...
```

### Trigger Actions When Entering and Exiting a XState State

Actions aren't limited to being called on transitions. They can also be called when we enter or exit a state node. This is done through the `entry` and `exit` properties.

The API for `entry` and `exit` actions is the same as that for `actions` on transitions. It can recieve a single function or an array of functions, each which will be called with the next `context` and the `event` object that caused the transition.

This is a powerful way to fire side effects based on states rather than transitions.

```javascript
//...
states: {
  broken: {
    entry: [
      (context, event) => {
        sideEffectToFireWhenWeEnterTheBrokenState(context, event)
      }
    ],
    exit: [
      (context, event) => {
        sideEffectToFireWhenWeExitTheBrokenState(context, event)
      }
    ]
  }
}
```

### Replace Inline Functions with String Shorthands

/

### Use Internal Transitions in XState to Avoid State Exit and Re-Entry

Transitions come in two varieties: "external" and "internal". By default, a transition is considered external. This means that a transition will _exit_ the current state node, and _enter_ the next state node (even if that state node is the state the machine is currently in). This exit/enter loop will trigger any actions that are set on the `exit` and `entry` properties.

A transition can be set to internal, either through setting a `.` (dot) in front of the state node name (as we do in this lesson), or through setting the property `internal` to `true` on the transition object.

When a transition is internal, it will not exit and enter the state node, which means that the actions in the `exit/transition/entry` loop will not be called.

### Send Events to the Machine with the XState Send Action Creator

XState provides the `send` function to create an action that will send the event passed in to the machine. If we provide the second argument to the `send` function, the `options` object, we can send the event `to` a particular machine. This is useful when you have invoked a machine as a service on a state node, a concept that will be explored in a later lesson.

### Track Infinite States with with XState Context

Consider a text input. It would be impossible for anyone to model every value you could possibly put into it, because the number of possible values is infinite. This is an infinite state.

Infinite state can be tracked and utilized by XState machines as "extended state". This extended state is called `context`. Context is passed to every function that is triggered by the machine: actions, activities, guards, and more.

### How Action Order Affects Assigns to Context in a XState Machine

While the order of actions in XState is fairly clear, how `assign`s are handled in them is non-obvious.

If you have a scenario where you try and utilize `context` in one action, then `assign` a new value to `context`, and _then_ try and utilize the new context in another action, you'll find that actually _both_ actions received the new `context` as their argument. Why does this happen?

This happens because `XState.Machine.transition` is a pure function. In order to remain pure, it does not run the actions, it accumulates them into an `actions` array that is returned in the next state object. Since `transition` does not run any side effects, it must calculate the next `context` object and return this on the state object as well. Thus, any action returned is then called in the interpreter with the next context, _not the context assumed to exist at the time and order the action was written_.

Under the hood, XState filters out `assign`s, batches them together, and returns the next `context` before any actions are run in the interpreter. It looks somewhat like this:

```javascript
let nextContext = context
const allActions = []
  .concat(stateNode.exit, transition.actions, nextStateNode.entry)
  .filter(Boolean) // remove any undefined actions such as `exit` and `entry`
  .map(toActionObject) // normalize the shape of all actions
  .filter((action) => {
    if (!action.type === 'xstate.assign') {
      // special type applied to assigns internall
      return true
    }

    // result of the assign function (not real implementation)
    nextContext = action.assignment(nextContext, eventObject)
  })

return {
  actions: allActions,
  context: nextContext,
}
```

### Use Activities in XState to Run Ongoing Side Effects

Activities are continuous, ongoing side effects that are triggered by entering a particular state, and only stop when that state is exited. In the example in this lesson, we have an alarm clock machine that does the activity of beeping for the duration of the `alarming` state.

Activities are a function that receives `context` and the `event` object (just like actions). They fire off the ongoing side effect in the body of the function, and optionally return a function that performs any cleanup necessary for the activity.

```javascript
{
  activities: {
    beeping: (context, event) => {
      const beep = () => {
        console.log('beep!')
      }

      beep()
      const interval = setInterval(beep, 1000)

      return () => {
        clearInterval(interval)
      }
    }
  }
}
```

### Conditionally Transition to States with Guards in XState

Not all transitions should be taken immediately. Occasionally, we would like to conditionally take a transition. We do this through the use of "guards". A "guard" is a predicate function (a function that returns a boolean) that is set on a transition object's `cond` property (short for "conditional").

When an event is sent to the machine and it encounters a transition object with a `cond` property set to a guard function, it will call that function with the current `context` and `event` object. If the guard returns `true`, the transition will be taken, otherwise, it will attempt the next transition for the event, or remain in the current state.

```javascript
//...
EVENT_NAME: {
  target: 'state-name-of-transition-target',
  cond: (context, event) => predicateFunction(context, event)
}
```

### Simplify State Explosion in XState through Hierarchical States

As our state machines grow more complex, we might find ourselves in a situation where a state should only exist if the machine is already in another state. To do this, we can use hierarchical states.

Instead of attempting to define all the states of a machine at a top level, we can nest states that should only be available as children of a parent state. These substates are written _exactly_ like the states of the top level of a machine: with an `initial` property, and the `states` of the nested state graph.

Using hierarchical states is a great way to avoid needing to check for booleans in an application. If a state can only exist when another state exists, consider if the one isn't in fact a child of the other.

### Multiple Simultaneous States with Parallel States

Can you walk and talk at the same time? If so, you've experienced what it's like to be in two states at the same time. Hopefully, those two states have no influence on the other. Whether or not you talk, you can walk, and vice versa. States that occur concurrently and have no affect on the other are known as "parallel states".

Parallel states happen simultaneously. The machine is in _all_ of the parallel states at the same time. To create a parallel state node, we set the `type` to `'parallel'` and then remove the `initial` state. There's no need for an `initial` property when you're in all the child states at the same time.

### Recall Previous States with XState History States Nodes

Generally speaking, state machines do not and should not have a sense of _time_. They are intended to be pure functions that receive a state and event and return the next state. Pure functions by design have no sense of _history_.

Yet, it is occasionally useful to return to a previous state. How is this accomplished? With history state nodes. Each state object returned by XState contains a special property that points to the previous state. When a history state node is defined and transitioned to, the machine returns to this previously stored state.

We can create a history node by defining the `type` as `history`, and setting the `history` property to either `shallow` (the default) or `deep`.

### Use XState Null Events and Transient Transitions to Immediately Transition States

It is often useful to identify conditional branching in your machine as a state itself. A state that is designed to determine the next state does not need a specific event sent to trigger the transition. Instead, we can use the "null event" to trigger an immediate, transient transition.

The null event is identified with an event name of an empty string `''`, and is immediately sent to the state upon entry. We can setup multiple targets with conditionals, or fire off actions to set up a future state with this transient transitions.

### Delay XState Events and Transitions

The passing of time can be represented as an event in XState. Rather than requiring the user to send an event after an amount of time has passed, XState provides the `after` property.

The value of `after` is an object whose keys are the milliseconds that should pass before a transition is taken. Consider a stop light transitioning from yellow to red after three seconds:

```javascript
//...
yellow: {
  after: { 3000: 'red' }
},
red: {
  //...
}
//...
```

We can also create dynamic delays with expressions using the `options` object as the second argument to `Machine`.

### Invoking a Promise for Asynchronous State Transitions in XState

Unbeknownst to many, promises are state machines. They exist in either an `idle`, `pending`, `resolved` or `rejected` state. Because they can be modeled as state machines, we can invoke them when we enter a state in a `Machine`.

We invoke services such as a promise by using the `invoke` property on a state node. When the state is entered, the `src` of the `invoke` object is called. In the case of promises, the `Promise` is called. When the `Promise` resolves, the `onDone` transition is taken. When the `Promise` rejects, the `onError` transition is taken. In either case, the data returned from the promise, whether resolved or errored, is passed back on the event object as `event.data`.

### Invoke Callbacks to Send and Receive Events from a Parent XState Machine

We can invoke a callback as a service when we enter a state in XState. This gives us the ability to trigger various functionality by responding to events sent to the service, and allows us to send events _back_ to the parent machine.

We do this by writing a "callback handler" and setting it as the `src` of our invoked service. A callback handler is a function that receives the current `context` and the `event` object that triggered the invocation. This function returns another function that receives two functions as arguments. A `callback` function to send events to the parent machine, and an `onEvent` function for the handler to respond to events sent to the handler.

The way events are sent to the callback handler is by utilizing the `options` argument of the `send` action creator. We identify where we send events to using the `to` property, and setting the value to the `id` of our service.

### Invoke Child XState Machines from a Parent Machine

Trying to structure the state logic of an application as a single machine can begin to become unwieldy when we have too many states. It is often better to divide our app into smaller machines and invoke those machines as necessary.

When we enter a state in a machine, we can invoke a child machine. This machine can send and receive events from the parent. When the child machine reaches a final state, the `onDone` transition is taken by the parent's current state node.

To invoke a child machine, we use the `invoke` property and set the `src` property to a machine. We can forward events in the parent machine to the child machine by setting the property `autoForwards` to `true`. We can also send events to the child machine through setting the second argument of the `send()` function to `{ to: 'child-machine-id' }`.

The child machine can send events to the parent machine by using the `sendParent` function. In this way, parent and child machines can communicate.
