---
title: Vector Spaces
description: A thorough exploration of vector spaces, from intuition and basic examples to subspaces, span, basis, dimension, and connections to machine learning.
---

Vector spaces are one of the central objects of linear algebra. They provide the setting in which ideas like linear combinations, span, basis, dimension, linear transformations, eigenvalues, and much of machine learning become meaningful.

A student often first meets vector spaces through arrows in the plane or lists of numbers like $(1,2,3)$. But the real idea is much broader. A vector space is not defined by what its elements *look like*. It is defined by how its elements **behave** under two operations:

- addition
- scalar multiplication

:::tip[Big picture]
A vector space is a mathematical world in which linear combinations make sense.
:::

## Why study vector spaces?

At first, vector spaces can seem abstract. Why not just study ordinary coordinate vectors in $\mathbb{R}^n$ and stop there?

The reason is that many very different mathematical objects obey the same linear rules:

- coordinate vectors
- polynomials
- matrices
- functions
- sequences
- random vectors in probability
- feature vectors and parameter vectors in machine learning

Once you understand vector spaces abstractly, all of these become examples of the same underlying structure.

:::note[Core idea]
Linear algebra is not really about arrows. It is about **structure**.
:::

## Intuition first

A vector space is a collection of objects that can be:

1. added together
2. multiplied by scalars

in a way that behaves nicely and predictably.

For example, in $\mathbb{R}^2$:

$$
(1,2) + (3,4) = (4,6)
$$

and

$$
2(1,2) = (2,4).
$$

This feels natural. But linear algebra wants to isolate exactly which rules make this kind of system work.

:::tip[Intuition]
The point is not that vectors are arrows. The point is that they can be combined linearly.
:::

## Scalars and vectors

Before giving the formal definition, it is important to separate two ideas:

- **vectors** are the objects in the space
- **scalars** are the numbers used to scale them

Usually, the scalars come from $\mathbb{R}$ or $\mathbb{C}$.

For example, in $\mathbb{R}^3$:

- $(1,0,2)$ is a vector
- $5$ is a scalar
- $5(1,0,2) = (5,0,10)$

The choice of scalars matters. A vector space over $\mathbb{R}$ is not quite the same thing as a vector space over $\mathbb{C}$.

## Formal definition

:::note[Definition]
A **vector space** over a field $F$ is a set $V$ together with two operations:

1. **vector addition**: a map $V \times V \to V$
2. **scalar multiplication**: a map $F \times V \to V$

such that for all $u,v,w \in V$ and all $a,b \in F$, the following axioms hold.
:::

### The vector space axioms

#### 1. Closure under addition

If $u,v \in V$, then $u+v \in V$.

#### 2. Commutativity of addition

$$
u+v = v+u
$$

#### 3. Associativity of addition

$$
(u+v)+w = u+(v+w)
$$

#### 4. Additive identity

There exists a vector $0 \in V$ such that

$$
v+0 = v
$$

for all $v \in V$.

#### 5. Additive inverse

For every $v \in V$, there exists $-v \in V$ such that

$$
v+(-v)=0
$$

#### 6. Closure under scalar multiplication

If $a \in F$ and $v \in V$, then $av \in V$.

#### 7. Distributivity over vector addition

$$
a(u+v)=au+av
$$

#### 8. Distributivity over scalar addition

$$
(a+b)v = av+bv
$$

#### 9. Compatibility of scalar multiplication

$$
a(bv)=(ab)v
$$

#### 10. Multiplicative identity of scalars

$$
1v=v
$$

:::caution[Do not memorize blindly]
At first, the list of axioms can feel dry. The goal is not to recite them mechanically. The goal is to understand that these are precisely the rules needed for linear combinations to behave sensibly.
:::

## The most important examples

## Example 1: $\mathbb{R}^n$

:::note[Example]
$\mathbb{R}^n$ is a vector space over $\mathbb{R}$.
:::

Its elements are ordered $n$-tuples:

$$
(x_1,x_2,\dots,x_n)
$$

Addition and scalar multiplication are defined componentwise:

$$
(x_1,\dots,x_n) + (y_1,\dots,y_n) = (x_1+y_1,\dots,x_n+y_n)
$$

and

$$
a(x_1,\dots,x_n) = (ax_1,\dots,ax_n).
$$

This is the standard example and the one most geometric intuition comes from.

### Special cases

- $\mathbb{R}$ is a vector space over $\mathbb{R}$
- $\mathbb{R}^2$ is the plane
- $\mathbb{R}^3$ is ordinary three-dimensional space

## Example 2: Polynomials

Let $P$ be the set of all real polynomials:

$$
p(x)=a_0+a_1x+a_2x^2+\cdots+a_nx^n.
$$

Then $P$ is a vector space over $\mathbb{R}$.

Why?

- the sum of two polynomials is a polynomial
- a scalar multiple of a polynomial is a polynomial
- the usual algebraic rules hold

:::tip[Important shift in perspective]
A vector does not have to be a list of numbers. A polynomial can be a vector.
:::

### Finite-dimensional polynomial spaces

The set of all polynomials of degree at most $n$, often written $P_n$, is also a vector space.

For example,

$$
P_2 = \{a+bx+cx^2 : a,b,c \in \mathbb{R}\}.
$$

This space has dimension $3$.

## Example 3: Matrices

The set of all $m \times n$ matrices with real entries, denoted $M_{m \times n}(\mathbb{R})$, is a vector space over $\mathbb{R}$.

Addition and scalar multiplication are again defined entrywise.

For example, if

$$
A=\begin{pmatrix}1&2\\3&4\end{pmatrix},
\qquad
B=\begin{pmatrix}5&6\\7&8\end{pmatrix},
$$

then

$$
A+B=
\begin{pmatrix}
6&8\\
10&12
\end{pmatrix}.
$$

## Example 4: Functions

Let $F(\mathbb{R},\mathbb{R})$ be the set of all real-valued functions on $\mathbb{R}$.

This is a vector space over $\mathbb{R}$, because if $f$ and $g$ are functions, then:

$$
(f+g)(x)=f(x)+g(x)
$$

and

$$
(af)(x)=a\,f(x).
$$

This is a huge example, and it helps show that vector spaces can be infinite-dimensional.

:::note[Example]
The functions $\sin x$, $\cos x$, and $e^x$ can be viewed as vectors in a function space.
:::

## Non-examples

Understanding what is **not** a vector space is just as important.

## Non-example 1: Positive vectors only

Consider the set

$$
S=\{(x,y)\in\mathbb{R}^2 : x>0,\ y>0\}.
$$

This is **not** a vector space.

Why? Because it is not closed under scalar multiplication. If $(1,1)\in S$, then

$$
-1(1,1)=(-1,-1)\notin S.
$$

## Non-example 2: The unit circle

Consider

$$
S=\{(x,y)\in\mathbb{R}^2 : x^2+y^2=1\}.
$$

This is not a vector space.

It is not closed under addition, and it is not closed under scalar multiplication.

For example,

$$
(1,0)\in S,
$$

but

$$
2(1,0)=(2,0)\notin S.
$$

## Non-example 3: Affine lines not through the origin

Consider

$$
L=\{(x,y)\in\mathbb{R}^2 : y=x+1\}.
$$

This is not a vector space.

The problem is that the zero vector $(0,0)$ is not in the set.

:::caution[Very common mistake]
A line in $\mathbb{R}^2$ is a vector space **only if it passes through the origin**.
:::

## Why the zero vector matters

Every vector space must contain the zero vector.

This is not just a technicality. The zero vector is essential because:

- it acts as the additive identity
- it is needed for additive inverses
- scalar multiplication by $0$ must produce a vector in the space

If a set does not contain the zero vector, it cannot be a vector space.

## Linear combinations

Once you have a vector space, the most important operation is forming **linear combinations**.

:::note[Definition]
A **linear combination** of vectors $v_1,\dots,v_k$ is any vector of the form

$$
a_1v_1+a_2v_2+\cdots+a_kv_k
$$

where $a_1,\dots,a_k$ are scalars.
:::

For example, in $\mathbb{R}^2$, if

$$
v_1=(1,0), \qquad v_2=(0,1),
$$

then

$$
3v_1-2v_2=(3,-2).
$$

Linear combinations are the heart of linear algebra. Vector spaces are the environments where linear combinations are allowed and well-behaved.

:::tip[Key idea]
If vector spaces are the stage, linear combinations are the main action.
:::

## Span

:::note[Definition]
The **span** of vectors $v_1,\dots,v_k$ is the set of all linear combinations of those vectors.

It is written as

$$
\operatorname{span}(v_1,\dots,v_k).
$$
:::

For example, in $\mathbb{R}^2$:

$$
\operatorname{span}((1,0),(0,1))=\mathbb{R}^2.
$$

But

$$
\operatorname{span}((1,1)) = \{(t,t): t\in\mathbb{R}\},
$$

which is the line through the origin with slope $1$.

### Why span matters

Span tells us which vectors can be built from a given collection.

This leads naturally to the ideas of:

- generating sets
- basis
- dimension

## Subspaces

Very often, we want to identify smaller vector spaces living inside bigger ones.

:::note[Definition]
A **subspace** of a vector space $V$ is a subset $W \subseteq V$ that is itself a vector space under the same operations.
:::

### Subspace test

A subset $W \subseteq V$ is a subspace if:

1. $0 \in W$
2. if $u,v \in W$, then $u+v \in W$
3. if $a \in F$ and $v \in W$, then $av \in W$

This is often much easier than checking all ten axioms from scratch.

:::tip[Why this works]
A subspace inherits the vector space structure from the larger space, so only closure properties and the presence of the zero vector must be checked explicitly.
:::

## Example: a subspace of $\mathbb{R}^3$

Consider

$$
W=\{(x,y,z)\in\mathbb{R}^3 : x+y+z=0\}.
$$

This is a subspace of $\mathbb{R}^3$.

### Check the conditions

First, the zero vector is in $W$ because

$$
0+0+0=0.
$$

Next, if $(x_1,y_1,z_1)$ and $(x_2,y_2,z_2)$ are in $W$, then

$$
x_1+y_1+z_1=0
\quad \text{and} \quad
x_2+y_2+z_2=0.
$$

Adding gives

$$
(x_1+x_2)+(y_1+y_2)+(z_1+z_2)=0,
$$

so the sum is in $W$.

Finally, if $a \in \mathbb{R}$ and $(x,y,z)\in W$, then

$$
a(x+y+z)=a\cdot 0=0,
$$

so $(ax,ay,az)\in W$.

Therefore $W$ is a subspace.

## Non-example of a subspace

Consider

$$
W=\{(x,y)\in\mathbb{R}^2 : x+y=1\}.
$$

This is not a subspace.

Why? Because $(0,0)\notin W$.

Again, failing to contain the zero vector immediately disqualifies it.

## Linear independence

:::note[Definition]
Vectors $v_1,\dots,v_k$ are **linearly independent** if the equation

$$
a_1v_1+\cdots+a_kv_k=0
$$

implies that

$$
a_1=a_2=\cdots=a_k=0.
$$

If there is a nontrivial solution, then the vectors are **linearly dependent**.
:::

### Intuition

A set of vectors is linearly independent if no vector in the set can be built from the others.

For example, in $\mathbb{R}^2$:

- $(1,0)$ and $(0,1)$ are linearly independent
- $(1,1)$ and $(2,2)$ are linearly dependent

because

$$
(2,2)=2(1,1).
$$

## Basis

Basis is one of the most beautiful ideas in all of mathematics.

:::note[Definition]
A **basis** of a vector space $V$ is a set of vectors that is:

1. linearly independent
2. spanning
:::

So a basis is a collection of vectors that is both:
- sufficient to build everything in the space
- free of redundancy

:::tip[Intuition]
A basis is the minimal “building kit” for the whole space.
:::

## Standard basis of $\mathbb{R}^n$

The standard basis vectors are:

$$
e_1=(1,0,\dots,0),\quad
e_2=(0,1,\dots,0),\quad
\dots,\quad
e_n=(0,0,\dots,1).
$$

Every vector

$$
(x_1,\dots,x_n)
$$

can be written as

$$
x_1e_1+x_2e_2+\cdots+x_ne_n.
$$

So $\{e_1,\dots,e_n\}$ is a basis of $\mathbb{R}^n$.

## Dimension

:::note[Definition]
If a vector space has a basis with $n$ vectors, then the **dimension** of the vector space is $n$.
:::

Examples:

- $\dim(\mathbb{R}^2)=2$
- $\dim(\mathbb{R}^3)=3$
- $\dim(P_2)=3$
- the space of all polynomials is infinite-dimensional

### Why dimension matters

Dimension tells us how many independent directions there are in the space.

It is one of the deepest and most fundamental numerical invariants of a vector space.

:::note[Important theorem]
Any two bases of a finite-dimensional vector space have the same number of elements.
:::

This theorem is what makes dimension well-defined.

## Coordinates relative to a basis

Once a basis is chosen, every vector can be described by coordinates.

For example, with the standard basis of $\mathbb{R}^3$:

$$
v=(2,-1,5)=2e_1- e_2 + 5e_3.
$$

So the coordinates of $v$ are simply:

$$
(2,-1,5).
$$

But coordinates depend on the basis.

That is an important conceptual point:

:::caution[Vector vs. coordinates]
A vector is not the same thing as its coordinate list. Coordinates depend on the chosen basis.
:::

## Advanced viewpoint: vector spaces as abstract objects

A beginner often thinks of a vector space as “a set of tuples.” But abstractly, a vector space is any set satisfying the axioms.

This means that two vector spaces may look very different but still be structurally the same.

For example, the space

$$
P_2 = \{a+bx+cx^2 : a,b,c\in \mathbb{R}\}
$$

is three-dimensional, just like $\mathbb{R}^3$.

In fact, each polynomial

$$
a+bx+cx^2
$$

can be identified with the coordinate vector

$$
(a,b,c).
$$

So from the perspective of vector space structure, these spaces are essentially the same.

## Infinite-dimensional spaces

Not every vector space has a finite basis.

For example:

- the space of all polynomials
- the space of all continuous functions on $[0,1]$
- the space of all sequences

These are generally infinite-dimensional.

That means no finite list of vectors can span the whole space.

:::tip[Conceptual leap]
Finite-dimensional vector spaces are only the beginning. Many important spaces in analysis, differential equations, probability, and physics are infinite-dimensional.
:::

## Vector spaces and linear transformations

Vector spaces are the natural domain and codomain of linear maps.

A function $T:V\to W$ is **linear** if:

$$
T(u+v)=T(u)+T(v)
$$

and

$$
T(av)=aT(v).
$$

So linear transformations preserve the vector space structure.

Without vector spaces, the study of linear maps would have no setting.

## Connections to machine learning

Vector spaces matter enormously in machine learning.

### Feature vectors

An input example is often represented as a vector:

$$
x=(x_1,x_2,\dots,x_n)\in\mathbb{R}^n.
$$

Each coordinate is a feature.

### Parameter vectors

A model often has parameters collected into a vector:

$$
\theta=(\theta_0,\theta_1,\dots,\theta_n).
$$

For linear regression:

$$
h_\theta(x)=\theta^T x.
$$

This only makes sense because both $x$ and $\theta$ live in vector spaces.

### Data matrices

A whole dataset is often stored in a matrix, whose rows or columns are vectors.

### Embeddings

In modern machine learning, words, images, users, and other objects are often embedded into vector spaces.

Then distance, angle, projection, and linear structure become meaningful.

:::note[Machine learning connection]
Much of machine learning can be viewed as learning geometric and algebraic structure in high-dimensional vector spaces.
:::

## Connections to probability

Probability also uses vector spaces.

Examples:

- random vectors in $\mathbb{R}^n$
- spaces of random variables
- expectation as a linear operator

For random variables $X$ and $Y$:

$$
\mathbb{E}[aX+bY]=a\mathbb{E}[X]+b\mathbb{E}[Y].
$$

That is a linearity property, and linearity is the language of vector spaces.

## Common confusions

:::caution[Confusion 1]
A set can contain vectors without being a vector space.
:::

:::caution[Confusion 2]
Not every line is a vector space. Only lines through the origin are.
:::

:::caution[Confusion 3]
Coordinates are not the vector itself; they are the representation of the vector relative to a basis.
:::

:::caution[Confusion 4]
Closure under addition and closure under scalar multiplication are both essential. Failing either one is enough to destroy vector space structure.
:::

## Worked examples

## Example 1: Is this a vector space?

Consider

$$
W=\{(x,y)\in\mathbb{R}^2 : y=2x\}.
$$

This is the line through the origin with slope $2$.

Check:

- $(0,0)\in W$
- if $(x,2x)$ and $(y,2y)$ are in $W$, then

$$
(x,2x)+(y,2y)=(x+y,2(x+y))\in W
$$

- if $a\in\mathbb{R}$, then

$$
a(x,2x)=(ax,2ax)\in W
$$

So this is a subspace, hence a vector space.

## Example 2: Is this a vector space?

Consider

$$
W=\{(x,y)\in\mathbb{R}^2 : y=2x+1\}.
$$

This is not a vector space because it does not contain $(0,0)$.

## Example 3: Span in $\mathbb{R}^2$

Let

$$
v_1=(1,2), \qquad v_2=(2,4).
$$

Then

$$
\operatorname{span}(v_1,v_2)
$$

is not all of $\mathbb{R}^2$, because $v_2=2v_1$.

So the span is just a line.

## Example 4: Basis of $P_2$

A basis for $P_2$ is

$$
\{1,x,x^2\}.
$$

Every polynomial in $P_2$ can be written uniquely as

$$
a+bx+cx^2.
$$

Thus $\dim(P_2)=3$.

## A more advanced structural perspective

One of the deep ideas of algebra is that a vector space is defined not by the nature of its elements, but by the operations and axioms.

This means we care about:
- linear structure
- span
- independence
- dimension
- linear maps

more than we care about whether the elements are:
- tuples
- polynomials
- matrices
- functions

That perspective is what allows mathematics to unify many seemingly different subjects.

:::tip[Structural thinking]
When you become comfortable with vector spaces, mathematics starts to feel less like a collection of disconnected topics and more like a study of recurring structures.
:::

## Summary

A vector space is a set equipped with addition and scalar multiplication satisfying a collection of linearity axioms. These axioms guarantee that linear combinations make sense and behave well.

The most important ideas built on top of vector spaces are:

- linear combinations
- span
- subspaces
- linear independence
- basis
- dimension

The standard example is $\mathbb{R}^n$, but many other spaces are also vector spaces, including spaces of polynomials, matrices, and functions.

Vector spaces matter not only in pure mathematics, but also in probability, statistics, optimization, and machine learning, where data, parameters, embeddings, and transformations are all naturally expressed in vector-space language.

## Further directions

After vector spaces, the next natural topics are:

1. subspaces
2. linear combinations and span
3. linear independence
4. basis
5. dimension
6. linear transformations
7. matrix representations
8. eigenvalues and eigenvectors

:::note[Suggested next page]
A perfect next note after this one is **Subspaces and Span**, because it takes the abstract definition of a vector space and begins using it in concrete ways.
:::
