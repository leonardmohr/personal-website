---
title: Vector Spaces Exercises
description: Exercises related to Vector Spaces
---
## Section 1A -- $R^n$ and $C^n$

1. Show that $\alpha + \beta = \beta + \alpha$ for all $\alpha,\beta \in \mathbb{C}$
   :::note
   To show that $\alpha + \beta = \beta + \alpha$ for all $\alpha, \beta \in \mathbb{C}$, suppose
   $$
   \alpha = a + bi \text{\quad and\quad} \beta = c + di,
   $$
   where $a,b,c,d \in \mathbb{R}$.  Then by definition of addition of complex numbers
   $$
   \begin{align*}
   \alpha + \beta &= (a + bi) + (c + di)\\
                  &= (a + c) + (b + d)i\\
                  &= (c + a) + (d + b)i && \text{ Commutativity of real numbers }\\
                  &= \beta + \alpha && \text{ Definition of addition of complex numbers } 
   \end{align*}
    $$
    Therefore $\alpha + \beta = \beta + \alpha \blacksquare$
   :::
 
2. Show that $(\alpha \beta) \lambda = \alpha (\beta \lambda)$ for all $\alpha, \beta, \lambda \in \mathbb{C}$

    :::note
    To show that $(\alpha \beta) \lambda = \alpha (\beta \lambda)$ for all $\alpha, \beta, \lambda \in \mathbb{C}$, suppose
    $$
    \alpha = a + bi \quad \text{ and } \quad \beta = c + di \quad \text{ and } \quad \lambda = f + gi
    $$
    for any $a,b,c,d,f,g \in \mathbb{R}$. Then by definition of multiplication in $\mathbb{C}$,
    $$
    \begin{align*}
    (\alpha \beta)\lambda &= ((ac - bd) + (ad + bc)i)(f + gi)\\
                      &= ((ac-bd)f - (ad + bc)g) + ((ac - bd)g + (ad + bc)f)i\\
                      &= (acf - bdf - adg - bcg) + (acg - bdg + adf + bcf)i
        \end{align*}
    $$
    and
    $$
    \begin{align*}
    \alpha (\beta \lambda) &= (a + bi)((c +di)(f + gi))\\
                       &= (a + bi)((cf - dg) + (cg + df)i)\\
                       &= (acf - adg - bcg - bdf) + (acg + adf + bcf - bdg)i\\
                       &= (acf - bdf - adg - bcg) + (acg - bdg + adf + bcf)i.
        \end{align*}
    $$
    Since addition and multiplication in $\mathbb{R}$ are commutative and associative, the two expressions are equal. Therefore,
    $$
    (\alpha \beta)\lambda = \alpha (\beta \lambda). \quad \blacksquare
    $$
    :::
    
3. Show that for every $\alpha \in C$, there exists a unique $\beta \in C$ such that $\alpha + \beta = 0.$
   
   :::note
   Existence: Let $\alpha = a + bi$ where $a,b \in \mathbb{R}$ and let $\beta = -a + (-b)i$.  Then by the definition of addition of complex numbers
   $$
   \begin{align*}
   \alpha + \beta &= (a + bi) + (-a + (-b)i)\\
                  &= (a + (-a)) + (b + (-b))i\\
                  &= (a-a) + (b-b)i\\
                  &= 0 + 0i\\
                  &= 0.
    \end{align*}
    $$
    
    Uniqueness: Assume that there exists $\beta_1, \beta_2 \in \mathbb{C}$ such that $\alpha + \beta_1 = 0$ and $\alpha + \beta_2 = 0$.  We show that $\beta_1 = \beta_2$.  To see this, note that
    $$
    \begin{align*}
    \beta_1 &= \beta_1 + 0\\
            &= \beta_1 + (\alpha + \beta_2) && \text{ Commutativity and Hypothesis } \\
            &= (\beta_1 + \alpha) + \beta_2 && \text{ Associativity }\\
            &= 0 + \beta_2 && \text{ Hypothesis } \\
            &= \beta_2 \blacksquare
    \end{align*}
    $$
    :::
    
4. Show that for every $\alpha \in \mathbb{C}$, where $\alpha \neq 0$, there exists a unique $\beta \in \mathbb{C}$ such that $\alpha\beta = 1$.

    :::note
    \textbf{Existence}: Let $\alpha = a + bi$, where $a,b \in \mathbb{R}$ and $\alpha \neq 0$.  First, let's think about what multiplying $\alpha$ by $\beta = c + di$, where $c,d \in \mathbb{R}$ would look like:
    $$
    \begin{align*}
    \alpha \cdot \beta &= (ac - bd) + (bc + ad)i.
    \end{align*}
    $$
    Then we want to find $c$ and $d$ such that
    $$
    ac - bd = 1 \quad \text{ and } \quad bc + ad = 0.
    $$
    This is just a system of linear equations, and so we can set it up as such:
    
    $$
    \begin{aligned} 
    \left[\begin{array}{cc}a & -b \\ b & a\end{array}\right] & \xrightarrow{r_1=a r_2} 
    \left[\begin{array}{cc}a^2 & -b a \\ b & a\end{array}\right]  & \xrightarrow{r_2=b r_2} 
    \left[\begin{array}{cc}a^2 & -b a \\ b^2 & a b\end{array}\right]  \\ &\xrightarrow{r_1=r_1+r_2} 
    \left[\begin{array}{cc}a^2+b^2 & 0 \\ b^2 & a b\end{array}\right] &\xrightarrow{r_1=\frac{r_1}{a^2+b^2}} 
    \left[\begin{array}{cc}1 & 0 \\ b^2 & a b\end{array}\right] \\ &\xrightarrow{r_2=b^2 r_1-r_2} 
    \left[\begin{array}{cc}1 & 0 \\ 0 & a b\end{array}\right] &\xrightarrow{r_2=\frac{r_2}{a b}} 
    \left[\begin{array}{cc}1 & 0 \\ 0 & 1\end{array}\right].\end{aligned} 
    $$
    
    Performing the same row operations on $\begin{bmatrix}1 \\0 \end{bmatrix}$ we get 
    $c = \frac{a}{a^2 + b^2}$  and  $d = \frac{-b}{a^2 + b^2}$. 
    
    Therefore, we see by inspection that if $\beta = \frac{a}{a^2 + b^2} - \frac{b}{a^2 + b^2}i$, then 
    $\alpha \beta = 1$.
    
    \textbf{Uniqueness:} Assume that there exist $\beta_1, \beta_2 \in \mathbb{C}$ such that $\alpha \beta_1 = 1$ and $\alpha \beta_2 = 1$. Then it
    follows that
    $$
    \begin{align*}
    \beta_1 &= \beta_1 \cdot 1\\
            &= \beta_1 \cdot (\alpha \beta_2)\\
            &= (\beta_1 \alpha) \beta_2\\
            &= (1) \beta_2\\
            &= \beta_2 \blacksquare
    \end{align*}
    $$
    :::
    
5. Show that
   $$
   \frac{-1+\sqrt{3} i}{2}
   $$
   is a cube root of 1 (meaning that its cube equals 1 ).
   
   :::note
   By inspection this is clear.  But what is really rather more interesting is that this is just one of the roots satisfying the equation
   $z^3 = 1$ (there are three).  The three roots are $(1,0), (-\frac{1}{2}, \frac{\sqrt{3}}{2}), (-\frac{1}{2}, -\frac{\sqrt{3}}{2})$. 
   Notice that these three points on the unit circle form an equilateral triangle.
   :::
   
6. Find two distinct square roots of $i$.
   :::note
   We want to find distinct $z_1, z_2 \in \mathbb{C}$ such that $z^2 = i$.
   
   Since $(a + bi)^2 = (a^2 - b^2) + (2ab)i$, we want to find two solutions to the system
   $$
   a^2 - b^2 = 0 \quad \text{ and } \quad ab = \frac{1}{2}.
   $$
   Therefore, two solutions are $-\sqrt{\frac{1}{2}} - \sqrt{\frac{1}{2}}i$ and $\sqrt{\frac{1}{2}} + \sqrt{\frac{1}{2}}i$.
   :::
   
## Section 1B -- Definition of a Vector Space
1. Prove that $-(-v) = v$ for every $v \in V$.
   :::note
   $$
   \begin{align*}
   -(-v) &= -(-1v) && \textit{\textcolor{blue}{$(-1)v = -v$}}\\
         &= (-1)(-1v) && \textit{\textcolor{blue}{$(-1)v = -v$}}\\
         &= (-1)(-1v + 0) && \textit{\textcolor{blue}{Additive Identity}}\\
         &= (-1)(-1v + 0v) && \textit{\textcolor{blue}{$0v = 0$}}\\
         &= (-1)(-1v) + (-1)(0v) && \textit{\textcolor{blue}{Distributive Property}}\\
         &= ((-1)(-1))(v) + ((-1)(0))v && \textit{\textcolor{blue}{Assosiativity}}\\
         &= 1v + 0v && \textit{\textcolor{blue}{Multiplication}}\\
         &= 1v + 0 && \textit{\textcolor{blue}{$0v = 0$}}\\
         &= 1v  && \textit{\textcolor{blue}{Additive Identity}}\\
         &= v \blacksquare
   \end{align*}
   $$
   :::
   
2. Suppose $a \in \bf{F}$, $v \in V$, and $av = 0$. Prove that $a = 0$ or $v = 0$.
   :::note
   By contradiction; assume that $a \in \bf{F}$, $v \in V$, and $av = 0$, but that $a \neq 0$ and $v \neq 0$.
   It thus follows that
   $$
   \begin{align*}
   av &= 0\\
   a^{-1}(av) &= a^{-1}(0) && \textit{\textcolor{blue}{Since $a \neq 0$ there exists multiplicative inverse}}\\
   (a^{-1}a)v &= 0 && \textit{\textcolor{blue}{Associativity}}\\
   1v &= 0 \\
   v &= 0.
   \end{align*}
   $$
   But this is not possible, since $a \neq 0$ and $v \neq 0$. So we have reached a contradiction, and our assumption must be false. $\blacksquare$ 
   :::
   
3. Suppose $v,w \in V$.  Explain why there exists a unique $x \in V$ such that $v + 3x = w$.
   :::note
   **Existence**: Let $x = -\frac{1}{3}v + \frac{1}{3}w$.  Then it follows that
   $$
   \begin{align*}
   v + 3x &= v + 3(-\frac{1}{3}v + \frac{1}{3}w) && \textit{\textcolor{blue}{Substitution of $x$}}\\
       &= v + (-v) + w && \textit{\textcolor{blue}{Distributive Properties}}\\
       &= w.
   \end{align*}
   $$
   
   **Uniqueness**: Assume that there exist $x$ and $x^\prime$ such that 
   $$
   v + 3x = w \quad \text{ and } \quad  v + 3x^\prime = w.
   $$
   We show that $x = x^\prime$.  To see this note that
   $$
   \begin{align*}
   v + 3x &= w && \textit{\textcolor{blue}{Hypothesis}}\\
   v + 3x &= v + 3x^\prime && \textit{\textcolor{blue}{Hypothesis}}\\
   v + 3x + (-v) &= v + 3x^\prime + (-v) && \textit{\textcolor{blue}{Adding $-v$ to both sides}}\\
   3x &= 3x^\prime  && \textit{\textcolor{blue}{Commutativity}}\\
       \frac{1}{3}(3x) &= \frac{1}{3}(3x^\prime) && \textit{\textcolor{blue}{Multiplying both sides by $ \frac{1}{3}$}}\\
   x &= x^\prime. \blacksquare && \textit{\textcolor{blue}{Associativity and mult. inverse}}
   \end{align*}
   $$
   :::
   
4. The empty set is not a vector space. The empty set fails to satisfy only on of the requirements listed in $1.19$.  Which one?
   :::note
   The empty set failes to sattisfy the additive identity. There does not exist an element
   $0 \in V$, since the empty set contains no elements. All other statements are vacuously true.
   :::
   
5. Show that in the definition of a vector space ($1.19$), the additive inverse can be replaced
   with the condition that 
   $$
   0v = 0 \text{ for all } v \in V.
   $$
   Here the $0$ on the left side is the number $0$, and the $0$ on the right side is the
   additive identity of $V$. (The phrase "a condition can be replaced" in a definition
   means that the collection of objects satisfying the definition is unchanged if the
   original condition is replaced with the new condition.)
   
   :::note
   The additive inverse:
   For every $v \in V$, there exists $w \in V$ such that $v + w = 0$.
   :::
   
 
