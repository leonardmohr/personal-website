---
title: Determining Circumference of Earth
description: How to determine the circumference of the earth.
---

## Background
How did we figure out the circumference of the earth?

## A Tale of Two Cities
Let's say we have two cities who are on the same longitude, and we know the
distance between the two cities, then the arc between the two cities forms a part of a meridian (an imaginary north-south line connecting the two poles) of the earth.  If we are able to determine the angle between the two
cities (relative to the center of the earth) then we can figure out the earth's circumference.

<div style="text-align: center;">
  <figure style="display: inline-block; margin: 0;">
    <img src="/src/content/docs/learning/other/two-cities.png" alt="Earth with two cities and central angle theta" width="500" />
    <figcaption>Figure 1: The central angle θ between the two cities.</figcaption>
  </figure>
</div>

## Determining Angle Between Cities
Due to the immense distance between the sun and the earth, the sun rays can be treated as parallel.  This means that at two different places on earth, the rays of the sun are the same at those two places.  Thus we can draw the following diagram, where $z_1$ is the solar zenith at City A, and $z_2$ is the solar zenith at City B. 
<div style="text-align: center;">
  <figure style="display: inline-block; margin: 0;">
    <img src="/src/content/docs/learning/other/solar-triangle.png" alt="Two Cities Angle" width="500" />
    <figcaption>The sun, the solar zenith at two points on earth, and theta.</figcaption>
  </figure>
</div>
Thus, if you are able to find the solar zenith at the two cities, you can find the $\theta$ as follows:

$$
\begin{align*}
\theta + z_1 + (180 - z_2) &= 180\\
\theta &= 180 - z_1 - (180 - z_2)\\
&= -z_1 + z_2\\
&= z_2 - z_1.
\end{align*}
$$

## Determining Solar Zenith
But how can we figure out the solar zenith? We need a stick of known length, and a way to measure it's shadow length. Placing the stick parallel to the earth, we are simply extending the imaginary line to the center of the earth, and thus get the following diagram:
<div style="text-align: center;">
  <figure style="display: inline-block; margin: 0;">
    <img src="/src/content/docs/learning/other/solar-zenith.png" alt="Solar Zenith" width="300" />
    <figcaption>Height of stick h, length of shadow s, and angle of solar zenith z.</figcaption>
  </figure>
</div>
We can thus calculate z as follows:

$$
\begin{align*}
    \tan (z) &= \frac{s}{h}\\
    \arctan \left(\frac{s}{h}\right) &= z.
\end{align*}
$$

## Determining Circumference of Earth
Instead of a stick, we will use the [Solar Position Calculator](https://gml.noaa.gov/grad/solcalc/azel.html).

Using this, we see that the solar zenith at this moment is:
- Alexandria: $22.0433746976$ degrees
- Syene, Egypt: $14.3730567635$ degrees.

The distance between the two cities is about 844 km.  Thus the total circumference of the earth is:

$$
\begin{align*}
\frac{844}{7.67} &= \frac{x}{360}\\
7.67x &= 360 \cdot 844\\
x &= \frac{360\cdot 844}{7.67}\\
&\approx 39,614
\end{align*}
$$
kilometers.

