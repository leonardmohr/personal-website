---
title: Combinatorial Analysis
description: Exercises related to Combinatorial Analysis
---
## Problems

1.
    - How many different 7-place license plates are possible if the first 2 places 
 are for letters and the other 5 for numbers? 
        :::note
        There are 26 different letters, and 10 different numbers.  Since there are 5 numbers chosen and 2 letters chosen, there are a total of 
        $$
        26^2 \cdot 10^5 = 67,600,000
        $$
        different possibilities.
        :::
     
    - Repeat part (a) under the assumption that no letter or number can be repeated
    in a single license plate.
    
       :::note
       There are
       $$
       26 \cdot 25 \cdot \frac{10!}{5!} = 19,656,000
       $$
       different possibilities.
       :::

2. How many outcome sequences are possible when a die is rolled four times, where we say, for instance, that the outcome is $3,4,3,1$ if the first roll landed on $3$, the second on 4, the third on 3, and the fourth on 1?
   :::note
   For a $6$ sided die, there are $6^4$ different possibilities.
   :::

3. Twenty workers are to be assigned to twenty different jobs, one to each job. How many different assignments are possible?
   :::note
   There are $20!$ different possible assignments.
   :::

4. John, Jim, Jay, and Jack have formed a band consisting of $4$ instruments. If each of the
boys can play all $4$ instruments, how many different arrangements are possible? What if John
and Jim can play all $4$ instruments, but Jay and Jack can each play only piano and drums?
    :::note
    If each member can play all $4$ instruments, then there are $4!$ different possible arrangements.
    
    If Jay and Jack can each play only piano and drums, then there are $2!$ different ways for
    John and Jim to select their instruments, and $2!$ different ways for Jay and Jack to select
    theirs.  Thus, there are 
    $$
    2 \cdot 2 = 4
    $$
    different arrangements.
    :::
    
5. For years, telephone area codes in the United States and Canada consisted of a sequence of three digits.  The first digit was an integer between 2 and 9, the second digit was either 0 or 1, and the third digit was an integer from 1 to 9.  How many area codes were possible? How many area codes starting with a 4 were possible?
   :::note
   There were a total of 
   $$
   8 \cdot 2 \cdot 9 = 144
   $$
   different possible area codes.
   
   If the first digit was a 4, then there were 
   $$
   1 \cdot 2 \cdot 9 = 18
   $$
   different possible area codes. 
   :::
   
6. A well-known nursery rhyme starts as follows: "As I was going to St. Ives, I met a man with
7 wives.  Each wife had 7 sacks.  Each sack had 7 cats.  Each cat had 7 kittens."

How many kittens did the traveler meet?
    :::note
    He met $7^4 = 2401$ kittens.
    :::

7.
    - In how many ways can 3 boys and 3 girls sit in a row?
        :::note
        If each person is unique, then there are $6! = 720$ different possible arrangements.
        :::
    - In how many ways can 3 boys and 3 girls sit in a row if the boys and the girls are to sit together?
        :::note
        There are $3!$ ways to arrange the boys, and $3!$ ways to arrange the girls.  We also need to select which group sits on which side, thus there are a total of
        $$
        3! \cdot 3! \cdot 2 = 72
        $$
        different arrangements.
        :::
    - In how many ways if only the boys must sit together?
        :::note
        There are $3!$ ways to arrange the boys, $3!$ ways to arrange the girls, and $4$ different places to place the group of boys (the $3$ girls create $4$ gaps).  Thus there are
        $$
        3! \cdot 3! \cdot 4 = 144
        $$
        different possible arrangements.
        :::
    - In how many ways if no two people of the same sex are allowed to sit next to each other?
        :::note
        This is just alternating boys and girls.  We first choose whether a boy or a girl sits first, then we arrange the boys and the girls.  Thus we have
        $$
        2 \cdot 3! \cdot 3! = 72
        $$
        different options.
        :::

8. How many different letter arrangements can be made from the letters
    - Fluke?
        :::note
        There are $5$ distinct letters, thus $5!$ arrangements.
        :::
    - Propose?
        :::note
        There are $7$ letters, so there are $7!$ different arrangements of letters, but `p` and `o` are each repeated twice, so we have
        $$
        \frac{7!}{2! \cdot 2!}
        $$
        different possibilities.
        :::
    - Mississippi?
        :::note
        There are $11$ characters, but both `s` and `i` are each repeated $4$ times, and `p` is repeated twice.  Therefore
        $$
        \frac{11!}{4! \cdot 4! \cdot 2!}.
        $$
        :::
    - Arrange?
        :::note
        There are $7$ letters, but both `r` and `a` are each repeated $2$ times, giving
        $$
        \frac{7!}{2! \cdot 2!}.
        $$
        :::

9. A child has $12$ blocks, of which $6$ are black, $4$ are red, $1$ is white, and $1$ is blue.  If the child puts the blocks in a line, how many arrangements are possible?
   :::note
   Assume blocks of the same color are indistinguishable.  If all $12$ blocks were distinct, there would be $12!$ arrangements.  Since the $6$ black blocks are indistinguishable among themselves and the $4$ red blocks are indistinguishable among themselves, the total number of arrangements is
   $$
   \frac{12!}{6! \cdot 4!}.
   $$
   :::

10. In how many ways can $8$ people be seated in a row if
     - there are no restrictions on the seating arrangement?
        :::note
        $8!$ different arrangements.
        :::
     - persons $A$ and $B$ must sit next to each other?
        :::note
        We can treat $A$ and $B$ as a single group, giving $7!$ arrangements of the seven "units," and there are $2!$ ways to order $A$ and $B$ within the group.  Thus there are
        $$
        7! \cdot 2!
        $$
        different arrangements.
        :::
     - there are $4$ men and $4$ women, and no $2$ men or $2$ women can sit next to each other?
        :::note
        The arrangement must alternate, so there are two patterns: `MFMFMFMF` or `FMFMFMFM`.  Within each pattern there are $4!$ ways to arrange the men and $4!$ ways to arrange the women.  Thus there are a total of
        $$
        2 \cdot 4! \cdot 4!
        $$
        different possible arrangements.
        :::
     - there are $5$ men and $3$ women and all the men must sit next to each other?
        :::note
        There are
        - $5!$ different ways to arrange the men,
        - $3!$ different ways to arrange the women, and
        - $4$ different places to place the group of men (after placing the $3$ women, there are $4$ gaps).
        
        Thus there are a total of
        $$
        5! \cdot 3! \cdot 4
        $$
        different possible arrangements.
        :::
     - there are $4$ married couples and each couple must sit together?
        :::note
        There are $4$ groups, and each group can be arranged $2!$ different ways.  The groups themselves can be arranged in $4!$ ways, so there are a total of
        $$
        4! \cdot 2^4
        $$
        different arrangements.
        :::

11. In how many ways can $3$ novels, $2$ math books, and $1$ chemistry book be arranged on a bookshelf if
     - the books can be arranged in any order?
        :::note
        There are $6$ books total, so there are $6!$ ways to arrange them.
        :::
     - the math books must be together and the novels must be together?
        :::note
        Thinking about this in components we have:
        - $3$ groups: $3!$ ways to arrange the groups,
        - $3!$ ways to arrange the novels,
        - $2!$ ways to arrange the math books,
        - $1!$ way to arrange the chemistry book.
        
        Thus there is a total of
        $$
        3! \cdot 3! \cdot 2!
        $$
        ways to arrange the books.
        :::
     - the novels must be together, but the other books can be arranged in any order?
        :::note
        There are $4$ blocks: the group of novels, the $2$ math books (one block each), and the chemistry book.  There are also $3!$ ways of arranging the novels within their block, giving a total of
        $$
        4! \cdot 3!
        $$
        arrangements.
        :::

12. Five separate awards (best scholarship, best leadership qualities, and so on) are to be presented to selected students from a class of 30.  How many different outcomes are possible if
     - a student can receive any number of awards?
        :::note
        At each point in choosing an award winner, there is a pool of $30$ students to choose from.  Thus there is a total of
        $$
        30^5
        $$
        different ways to hand out the awards.
        :::
     - a student can receive at most one award?
        :::note
        At each award, the previously selected student is removed from the pool.  Thus there are a total of
        $$
        \frac{30!}{25!}
        $$
        different ways to hand out the awards.
        :::

13. Consider a group of 20 people.  If everyone shakes hands with everyone else, how many handshakes take place?
    :::note
    Each person shakes $19$ hands, and there are a total of $20$ people, but each handshake is counted twice.  So there are a total of
    $$
    \frac{20 \cdot 19}{2} = 190
    $$
    total handshakes.
    :::

14. How many $5$ card poker hands are there?
    :::note
    A standard deck of cards has $52$ cards.  This means that there are a total of
    $$
    \frac{52!}{47!}
    $$
    ways to choose $5$ different cards in order.  But the order of the cards in your hand does not matter, so we need to divide out the duplicates.  This means that there is a total of
    $$
    \frac{52!}{47! \cdot 5!} = \binom{52}{5}
    $$
    legal $5$ card poker hands.
    :::

15. A dance class consists of 22 students, 10 women and 12 men. If 5 men and 5 women are to be chosen and then paired off, how many results are possible?
    :::note
    - Choosing 5 men from 12: $\binom{12}{5} = \frac{12!}{5!7!}$
    - Choosing 5 women from 10: $\binom{10}{5} = \frac{10!}{5!5!}$
    - Pairing 5 with 5: Imagine we arrange the women in a row:
      $$
      A-B-C-D-E
      $$
      We want to figure out how many ways there are to arrange the 5 men on top of the women:
      $$
      M - N - O - P - Q\\
      A - B - C - D - E
      $$
      Here the arrangement of the men matters, so there are $5!$ different options.
      
    Thus, in total there are 
    $$
    \begin{align*}
    \text{ Arrangements } &= \binom{12}{5} \binom{10}{5} 5!\\\\
                          &= \frac{12!10!5!}{5!7!5!5!}\\\\
                          &= \frac{12!10!}{7!5!5!}.
    \end{align*}
    $$
    :::

16. A student has to sell 2 books from a collection of 6 math, 7 science, and 4 economics books.  How many choices are possible if
    - both books are to be on the same subject?
        :::note
        :::
    - the books are to be on different subjects?
        :::note
        :::

17. Seven different gifts are to be distributed among 10 children.  How many distinct results are possible if no child is to receive more than one gift?
    :::note
    :::

18. A committee of 7, consisting of 2 Republicans, 2 Democrats, and 3 Independents, is to be chosen from a group of 5 Republicans, 6 Democrats, and 4 Independents.  How many committees are possible?
    :::note
    :::

19. From a group of 8 women and 6 men, a committee consisting of 3 men and 3 women is to be formed.  How many different committees are possible if
    - 2 of the men refuse to serve together?
        :::note
        :::
    - 2 of the women refuse to serve together?
        :::note
        :::
    - 1 man and 1 woman refuse to serve together?
        :::note
        :::

20. A person has 8 friends, of whom 5 will be invited to a party.
    - How many choices are there if 2 of the friends are feuding and will not attend together?
        :::note
        :::
    - How many choices if 2 of the friends will only attend together?
        :::note
        :::

21. Consider a grid of points.  Suppose that, starting at the point labeled $A$, you can go one step up or one step to the right at each move.  This procedure is continued until the point labeled $B$ is reached.  How many different paths from $A$ to $B$ are possible?  Hint: Note that to reach $B$ from $A$, you must take 4 steps to the right and 3 steps upward.
    :::note
    :::

22. In Problem 21, how many different paths are there from $A$ to $B$ that go through the point circled in the lattice?
    :::note
    :::

23. A psychology laboratory conducting dream research contains 3 rooms, with 2 beds in each room.  If 3 sets of identical twins are to be assigned to these 6 beds so that each set of twins sleeps in different beds in the same room, how many assignments are possible?
    :::note
    :::

24. Expand $(3x^2 + y)^5$.
    :::note
    :::

25. The game of bridge is played by 4 players, each of whom is dealt 13 cards.  How many bridge deals are possible?
    :::note
    :::

26. Expand $(x_1 + 2x_2 + 3x_3)^4$.
    :::note
    :::

27. If 12 people are to be divided into 3 committees of respective sizes 3, 4, and 5, how many divisions are possible?
    :::note
    :::

28. If 8 new teachers are to be divided among 4 schools, how many divisions are possible?  What if each school must receive 2 teachers?
    :::note
    :::

29. Ten weight lifters are competing in a team weightlifting contest.  Of the lifters, 3 are from the United States, 4 are from Russia, 2 are from China, and 1 is from Canada.  If the scoring takes account of the countries that the lifters represent, but not their individual identities, how many different outcomes are possible from the point of view of scores?  How many different outcomes correspond to results in which the United States has 1 competitor in the top three and 2 in the bottom three?
    :::note
    :::

30. Delegates from 10 countries, including Russia, France, England, and the United States, are to be seated in a row.  How many different seating arrangements are possible if the French and English delegates are to be seated next to each other and the Russian and U.S. delegates are not to be next to each other?
    :::note
    :::

31. ${}^*$ If 8 identical blackboards are to be divided among 4 schools, how many divisions are possible?  How many if each school must receive at least 1 blackboard?
    :::note
    :::

32. ${}^*$ An elevator starts at the basement with 8 people (not including the elevator operator) and discharges them all by the time it reaches the top floor, number 6.  In how many ways could the operator have perceived the people leaving the elevator if all people look alike to him?  What if the 8 people consisted of 5 men and 3 women and the operator could tell a man from a woman?
    :::note
    :::

33. ${}^*$ We have \$20,000 that must be invested among 4 possible opportunities.  Each investment must be integral in units of \$1000, and there are minimal investments that need to be made if one is to invest in these opportunities.  The minimal investments are \$2000, \$2000, \$3000, and \$4000.  How many different investment strategies are available if
    - an investment must be made in each opportunity?
        :::note
        :::
    - investments must be made in at least 3 of the 4 opportunities?
        :::note
        :::

34. ${}^*$ Suppose that 10 fish are caught at a lake that contains 5 distinct types of fish.
    - How many different outcomes are possible, where an outcome specifies the numbers of caught fish of each of the 5 types?
        :::note
        :::
    - How many outcomes are possible when 3 of the 10 fish caught are trout?
        :::note
        :::
    - How many when at least 2 of the 10 are trout?
        :::note
        :::

## Theoretical Exercises

1. Prove the generalized version of the basic counting principle.
   :::note
   :::

2. Two experiments are to be performed.  The first can result in any one of $m$ possible outcomes.  If the first experiment results in outcome $i$, then the second experiment can result in any of $n_i$ possible outcomes, $i = 1, 2, \ldots, m$.  What is the number of possible outcomes of the two experiments?
   :::note
   :::

3. In how many ways can $r$ objects be selected from a set of $n$ objects if the order of selection is considered relevant?
   :::note
   :::

4. There are $\binom{n}{r}$ different linear arrangements of $n$ balls of which $r$ are black and $n - r$ are white.  Give a combinatorial explanation of this fact.
   :::note
   :::

5. Determine the number of vectors $(x_1, \ldots, x_n)$, such that each $x_i$ is either $0$ or $1$ and
    $$
    \sum_{i=1}^n x_i \geq k.
    $$
    :::note
    :::

6. How many vectors $x_1, \ldots, x_k$ are there for which each $x_i$ is a positive integer such that $1 \leq x_i \leq n$ and $x_1 < x_2 < \cdots < x_k$?
   :::note
   :::

7. Give an analytic proof of Equation (4.1).
   :::note
   :::

8. Prove that
    $$
    \binom{n+m}{r} = \binom{n}{0}\binom{m}{r} + \binom{n}{1}\binom{m}{r-1} + \cdots + \binom{n}{r}\binom{m}{0}.
    $$
    Hint: Consider a group of $n$ men and $m$ women.  How many groups of size $r$ are possible?
    :::note
    :::

9. Use Theoretical Exercise 8 to prove that
    $$
    \binom{2n}{n} = \sum_{k=0}^n \binom{n}{k}^2.
    $$
    :::note
    :::

10. From a group of $n$ people, suppose that we want to choose a committee of $k$, $k \leq n$, one of whom is to be designated as chairperson.
    - By focusing first on the choice of the committee and then on the choice of the chair, argue that there are $\binom{n}{k} k$ possible choices.
        :::note
        :::
    - By focusing first on the choice of the nonchair committee members and then on the choice of the chair, argue that there are $\binom{n}{k-1}(n - k + 1)$ possible choices.
        :::note
        :::
    - By focusing first on the choice of the chair and then on the choice of the other committee members, argue that there are $n \binom{n-1}{k-1}$ possible choices.
        :::note
        :::
    - Conclude from parts (a), (b), and (c) that
        $$
        k\binom{n}{k} = (n - k + 1)\binom{n}{k-1} = n\binom{n-1}{k-1}.
        $$
        :::note
        :::
    - Use the factorial definition of $\binom{m}{r}$ to verify the identity in part (d).
        :::note
        :::

11. The following identity is known as Fermat's combinatorial identity:
    $$
    \binom{n}{k} = \sum_{i=k}^n \binom{i-1}{k-1}, \quad n \geq k.
    $$
    Give a combinatorial argument (no computations are needed) to establish this identity.  Hint: Consider the set of numbers 1 through $n$.  How many subsets of size $k$ have $i$ as their highest numbered member?
    :::note
    :::

12. Consider the following combinatorial identity:
    $$
    \sum_{k=1}^n k \binom{n}{k} = n \cdot 2^{n-1}.
    $$
    - Present a combinatorial argument for this identity by considering a set of $n$ people and determining, in two ways, the number of possible selections of a committee of any size and a chairperson for the committee.  Hint:
        1. How many possible selections are there of a committee of size $k$ and its chairperson?
        2. How many possible selections are there of a chairperson and the other committee members?
        
        :::note
        :::
    - Verify the following identity for $n = 1, 2, 3, 4, 5$:
        $$
        \sum_{k=1}^n \binom{n}{k} k^2 = 2^{n-2} n(n + 1).
        $$
        For a combinatorial proof of the preceding, consider a set of $n$ people and argue that both sides of the identity represent the number of different selections of a committee, its chairperson, and its secretary (possibly the same as the chairperson).  Hint:
        1. How many different selections result in the committee containing exactly $k$ people?
        2. How many different selections are there in which the chairperson and the secretary are the same? (answer: $n 2^{n-1}$.)
        3. How many different selections result in the chairperson and the secretary being different?
        
        :::note
        :::
    - Now argue that
        $$
        \sum_{k=1}^n \binom{n}{k} k^3 = 2^{n-3} n^2 (n + 3).
        $$
        :::note
        :::

13. Show that, for $n > 0$,
    $$
    \sum_{i=0}^n (-1)^i \binom{n}{i} = 0.
    $$
    Hint: Use the binomial theorem.
    :::note
    :::

14. From a set of $n$ people, a committee of size $j$ is to be chosen, and from this committee, a subcommittee of size $i$, $i \leq j$, is also to be chosen.
    - Derive a combinatorial identity by computing, in two ways, the number of possible choices of the committee and subcommittee — first by supposing that the committee is chosen first and then the subcommittee is chosen, and second by supposing that the subcommittee is chosen first and then the remaining members of the committee are chosen.
        :::note
        :::
    - Use part (a) to prove the following combinatorial identity:
        $$
        \sum_{j=i}^n \binom{n}{j}\binom{j}{i} = \binom{n}{i} 2^{n-i}, \quad i \leq n.
        $$
        :::note
        :::
    - Use part (a) and Theoretical Exercise 13 to show that
        $$
        \sum_{j=i}^n \binom{n}{j}\binom{j}{i}(-1)^{n-j} = 0, \quad i < n.
        $$
        :::note
        :::

15. Let $H_k(n)$ be the number of vectors $x_1, \ldots, x_k$ for which each $x_i$ is a positive integer satisfying $1 \leq x_i \leq n$ and $x_1 \leq x_2 \leq \cdots \leq x_k$.
    - Without any computations, argue that
        $$
        \begin{aligned}
        H_1(n) &= n, \\\\
        H_k(n) &= \sum_{j=1}^n H_{k-1}(j), \quad k > 1.
        \end{aligned}
        $$
        Hint: How many vectors are there in which $x_k = j$?
        :::note
        :::
    - Use the preceding recursion to compute $H_3(5)$.  Hint: First compute $H_2(n)$ for $n = 1, 2, 3, 4, 5$.
        :::note
        :::

16. Consider a tournament of $n$ contestants in which the outcome is an ordering of these contestants, with ties allowed.  That is, the outcome partitions the players into groups, with the first group consisting of the players who tied for first place, the next group being those who tied for the next-best position, and so on.  Let $N(n)$ denote the number of different possible outcomes.  For instance, $N(2) = 3$, since, in a tournament with 2 contestants, player 1 could be uniquely first, player 2 could be uniquely first, or they could tie for first.
    - List all the possible outcomes when $n = 3$.
        :::note
        :::
    - With $N(0)$ defined to equal $1$, argue, without any computations, that
        $$
        N(n) = \sum_{i=1}^n \binom{n}{i} N(n - i).
        $$
        Hint: How many outcomes are there in which $i$ players tie for last place?
        :::note
        :::
    - Show that the formula of part (b) is equivalent to the following:
        $$
        N(n) = \sum_{i=0}^{n-1} \binom{n}{i} N(i).
        $$
        :::note
        :::
    - Use the recursion to find $N(3)$ and $N(4)$.
        :::note
        :::

17. Present a combinatorial explanation of why $\binom{n}{r} = \binom{n}{r, n - r}$.
    :::note
    :::

18. Argue that
    $$
    \binom{n}{n_1, n_2, \ldots, n_r} = \binom{n - 1}{n_1 - 1, n_2, \ldots, n_r} + \binom{n - 1}{n_1, n_2 - 1, \ldots, n_r} + \cdots + \binom{n - 1}{n_1, n_2, \ldots, n_r - 1}.
    $$
    Hint: Use an argument similar to the one used to establish Equation (4.1).
    :::note
    :::

19. Prove the multinomial theorem.
    :::note
    :::

20. ${}^*$ In how many ways can $n$ identical balls be distributed into $r$ urns so that the $i$th urn contains at least $m_i$ balls, for each $i = 1, \ldots, r$?  Assume that $n \geq \sum_{i=1}^r m_i$.
    :::note
    :::

21. ${}^*$ Argue that there are exactly $\binom{r}{k}\binom{n-1}{n - r + k}$ solutions of
    $$
    x_1 + x_2 + \cdots + x_r = n
    $$
    for which exactly $k$ of the $x_i$ are equal to $0$.
    :::note
    :::

22. ${}^*$ Consider a function $f(x_1, \ldots, x_n)$ of $n$ variables.  How many different partial derivatives of order $r$ does $f$ possess?
    :::note
    :::

23. ${}^*$ Determine the number of vectors $(x_1, \ldots, x_n)$ such that each $x_i$ is a nonnegative integer and
    $$
    \sum_{i=1}^n x_i \leq k.
    $$
    :::note
    :::

## Self-Test Problems and Exercises

1. How many different linear arrangements are there of the letters A, B, C, D, E, F for which
    - A and B are next to each other?
        :::note
        :::
    - A is before B?
        :::note
        :::
    - A is before B and B is before C?
        :::note
        :::
    - A is before B and C is before D?
        :::note
        :::
    - A and B are next to each other and C and D are also next to each other?
        :::note
        :::
    - E is not last in line?
        :::note
        :::

2. If 4 Americans, 3 French people, and 3 British people are to be seated in a row, how many seating arrangements are possible when people of the same nationality must sit next to each other?
   :::note
   :::

3. A president, treasurer, and secretary, all different, are to be chosen from a club consisting of 10 people.  How many different choices of officers are possible if
    - there are no restrictions?
        :::note
        :::
    - $A$ and $B$ will not serve together?
        :::note
        :::
    - $C$ and $D$ will serve together or not at all?
        :::note
        :::
    - $E$ must be an officer?
        :::note
        :::
    - $F$ will serve only if he is president?
        :::note
        :::

4. A student is to answer 7 out of 10 questions in an examination.  How many choices has she?  How many if she must answer at least 3 of the first 5 questions?
   :::note
   :::

5. In how many ways can a man divide 7 gifts among his 3 children if the eldest is to receive 3 gifts and the others 2 each?
   :::note
   :::

6. How many different 7-place license plates are possible when 3 of the entries are letters and 4 are digits?  Assume that repetition of letters and numbers is allowed and that there is no restriction on where the letters or numbers can be placed.
   :::note
   :::

7. Give a combinatorial explanation of the identity
    $$
    \binom{n}{r} = \binom{n}{n - r}.
    $$
    :::note
    :::

8. Consider $n$-digit numbers where each digit is one of the 10 integers $0, 1, \ldots, 9$.  How many such numbers are there for which
    - no two consecutive digits are equal?
        :::note
        :::
    - $0$ appears as a digit a total of $i$ times, $i = 0, \ldots, n$?
        :::note
        :::

9. Consider three classes, each consisting of $n$ students.  From this group of $3n$ students, a group of 3 students is to be chosen.
    - How many choices are possible?
        :::note
        :::
    - How many choices are there in which all 3 students are in the same class?
        :::note
        :::
    - How many choices are there in which 2 of the 3 students are in the same class and the other student is in a different class?
        :::note
        :::
    - How many choices are there in which all 3 students are in different classes?
        :::note
        :::
    - Using the results of parts (a) through (d), write a combinatorial identity.
        :::note
        :::

10. How many 5-digit numbers can be formed from the integers $1, 2, \ldots, 9$ if no digit can appear more than twice?  (For instance, $41434$ is not allowed.)
    :::note
    :::

11. From 10 married couples, we want to select a group of 6 people that is not allowed to contain a married couple.
    - How many choices are there?
        :::note
        :::
    - How many choices are there if the group must also consist of 3 men and 3 women?
        :::note
        :::

12. A committee of 6 people is to be chosen from a group consisting of 7 men and 8 women.  If the committee must consist of at least 3 women and at least 2 men, how many different committees are possible?
    :::note
    :::

13. ${}^*$ An art collection on auction consisted of 4 Dalis, 5 van Goghs, and 6 Picassos.  At the auction were 5 art collectors.  If a reporter noted only the number of Dalis, van Goghs, and Picassos acquired by each collector, how many different results could have been recorded if all of the works were sold?
    :::note
    :::

14. ${}^*$ Determine the number of vectors $(x_1, \ldots, x_n)$ such that each $x_i$ is a positive integer and
    $$
    \sum_{i=1}^n x_i \leq k,
    $$
    where $k \geq n$.
    :::note
    :::

15. A total of $n$ students are enrolled in a review course for the actuarial examination in probability.  The posted results of the examination will list the names of those who passed, in decreasing order of their scores.  For instance, the posted result will be "Brown, Cho" if Brown and Cho are the only ones to pass, with Brown receiving the higher score.  Assuming that all scores are distinct (no ties), how many posted results are possible?
    :::note
    :::

16. How many subsets of size 4 of the set $S = \{1, 2, \ldots, 20\}$ contain at least one of the elements $1, 2, 3, 4, 5$?
    :::note
    :::

17. Give an analytic verification of
    $$
    \binom{n}{2} = \binom{k}{2} + k(n - k) + \binom{n - k}{2}, \quad 1 \leq k \leq n.
    $$
    Now, give a combinatorial argument for this identity.
    :::note
    :::

18. In a certain community, there are 3 families consisting of a single parent and 1 child, 3 families consisting of a single parent and 2 children, 5 families consisting of 2 parents and a single child, 7 families consisting of 2 parents and 2 children, and 6 families consisting of 2 parents and 3 children.  If a parent and child from the same family are to be chosen, how many possible choices are there?
    :::note
    :::

19. If there are no restrictions on where the digits and letters are placed, how many 8-place license plates consisting of 5 letters and 3 digits are possible if no repetitions of letters or digits are allowed?  What if the 3 digits must be consecutive?
    :::note
    :::

20. Verify that the equality
    $$
    \sum_{\substack{x_1 + \cdots + x_r = n \\\\ x_i \geq 0}} \frac{n!}{x_1! x_2! \cdots x_r!} = r^n
    $$
    when $n = 3$, $r = 2$, and then show that it is always valid.  (The sum is over all vectors of $r$ nonnegative integer values whose sum is $n$.)
    Hint: How many different $n$ letter sequences can be formed from the first $r$ letters of the alphabet?  How many of them use letter $i$ of the alphabet a total of $x_i$ times for each $i = 1, \ldots, r$?
    :::note
    :::
