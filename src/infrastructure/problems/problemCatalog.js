const LldProblem = require('../../domain/models/LldProblem');

/**
 * Pre-seeded catalog of LLD practice problems.
 * Each problem has clear requirements and context for meaningful attempts.
 */
const problemCatalog = [
  new LldProblem({
    id: 'parking-lot-1',
    title: 'Parking Lot',
    description:
      'Design a parking lot system that can manage vehicle parking across multiple floors with different parking spot types (compact, regular, large).',
    requirements: [
      'The parking lot has multiple floors, each with a fixed number of spots.',
      'Each floor has compact, regular, and large spots with different capacity.',
      'Vehicles include motorcycles, cars, and buses. Buses should occupy 5 consecutive regular spots.',
      'The system should find the nearest available spot for an incoming vehicle.',
      'The system should track available spots per floor and per type.',
      'A ticket should be issued on entry and payment calculated on exit based on time parked.',
    ],
    constraints: [
      'Assume vehicles enter and exit one at a time.',
      'Parking spots are allocated based on vehicle size.',
      'Time complexity for parking should be O(1) for spot lookup.',
    ],
    hints: [
      'Consider using inheritance or composition for vehicle types.',
      'Think about how to efficiently find the nearest available spot.',
      'Use the strategy pattern for pricing based on vehicle type and duration.',
    ],
    difficulty: 'medium',
    tags: ['parking', 'concurrency', 'data-structures'],
  }),

  new LldProblem({
    id: 'elevator-1',
    title: 'Elevator System',
    description:
      'Design an elevator system for a building with multiple elevators that can move between floors efficiently.',
    requirements: [
      'The building has N floors and M elevators.',
      'Elevators can move up and down, stopping at requested floors.',
      'The system should handle floor requests from both inside the elevator and outside.',
      'Elevators should be dispatched efficiently to minimize wait time.',
      'Display current floor, direction, and door status for each elevator.',
    ],
    constraints: [
      'Each elevator has a maximum capacity.',
      'Elevators only stop at floors where they are requested and not full.',
      'The system should not cause starvation of any floor request.',
    ],
    hints: [
      'Consider the shortest seek time or scan algorithm for dispatching.',
      'Think about the state machine for elevator doors.',
      'Consider thread safety if multiple requests can arrive concurrently.',
    ],
    difficulty: 'medium',
    tags: ['elevator', 'state-machine', 'concurrency'],
  }),

  new LldProblem({
    id: 'vending-machine-1',
    title: 'Vending Machine',
    description:
      'Design a vending machine that dispenses products when money is inserted and handles change calculation.',
    requirements: [
      'The vending machine has multiple products with prices and quantities.',
      'Users can insert coins and bills of various denominations.',
      'The machine should display the total amount inserted and available products.',
      'Users can select a product; the machine dispenses it and returns change if any.',
      'The machine should handle out-of-stock scenarios and insufficient funds.',
      'Admin should be able to restock products and collect money.',
    ],
    constraints: [
      'The machine should return the minimum number of coins for change.',
      'Transactions should be atomic - either fully succeed or fully fail.',
      'The machine should track sales and inventory.',
    ],
    hints: [
      'Consider using the state pattern for machine states (idle, waiting, dispensing, out-of-stock).',
      'Use the strategy pattern for different change-making algorithms.',
      'Think about how to handle concurrent access to inventory.',
    ],
    difficulty: 'medium',
    tags: ['vending', 'state-machine', 'transaction'],
  }),

  new LldProblem({
    id: 'library-1',
    title: 'Library Management System',
    description:
      'Design a library management system that allows users to search for books, borrow books, and return books.',
    requirements: [
      'The library has books, each with a unique ISBN, title, author, and publication date.',
      'Users (members) can search books by title, author, ISBN, or publication date.',
      'Members can check out up to 5 books at a time.',
      'Books have a due date; overdue books accrue a daily fine.',
      'Librarians can add, remove, and modify book records.',
      'The system should prevent checkout if the book is already borrowed.',
    ],
    constraints: [
      'Each book copy is uniquely identified even if they share the same ISBN.',
      'Reservation system: if a book is checked out, members can reserve it.',
      'The system should send notifications for due dates (conceptual).',
    ],
    hints: [
      'Consider using the observer pattern for notifications.',
      'Think about how to model the relationship between books and their copies.',
      'Consider using the factory pattern for creating different user types.',
    ],
    difficulty: 'medium',
    tags: ['library', 'search', 'reservation'],
  }),

  new LldProblem({
    id: 'tictactoe-1',
    title: 'Tic-Tac-Toe Game',
    description:
      'Design a Tic-Tac-Toe game that allows two players to play on an N x N board. The game should support win detection and replay functionality.',
    requirements: [
      'The game is played on an N x N grid where N >= 3.',
      'Two players take turns marking cells with their symbol (X or O).',
      'The game should detect wins (rows, columns, diagonals) and ties.',
      'Players should not be able to mark an already occupied cell.',
      'The game should support multiple replay rounds.',
      'The game should track move history for replay purposes.',
    ],
    constraints: [
      'Win detection should be efficient - O(1) per move check is possible for N x N board.',
      'The game should validate all inputs.',
    ],
    hints: [
      'Consider using the command pattern for moves to support undo/replay.',
      'Use the observer pattern to notify UI of game state changes.',
      'Think about extending to support different board sizes and rules.',
    ],
    difficulty: 'easy',
    tags: ['game', 'state-machine', 'win-detection'],
  }),

  new LldProblem({
    id: 'cache-1',
    title: 'LRU Cache',
    description:
      'Design and implement an LRU (Least Recently Used) cache that supports get and put operations in O(1) time complexity.',
    requirements: [
      'The cache has a fixed capacity.',
      'get(key) returns the value if key exists, otherwise -1; also updates the recency.',
      'put(key, value) inserts or updates the value; evicts the LRU item if capacity is exceeded.',
      'Both get and put must run in O(1) average time.',
      'The cache should support a method to display current contents.',
    ],
    constraints: [
      'Capacity is set at initialization and cannot change.',
      'Keys are integers, values are arbitrary.',
    ],
    hints: [
      'Combine a hash map with a doubly linked list for O(1) operations.',
      'Think about edge cases: empty cache, single element, capacity of 1.',
      'Consider thread safety if accessed by multiple threads.',
    ],
    difficulty: 'easy',
    tags: ['data-structures', 'LRU', 'hash-map', 'linked-list'],
  }),
];

module.exports = problemCatalog;
