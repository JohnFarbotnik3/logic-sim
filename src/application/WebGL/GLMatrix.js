/*
	A utility for performing graphics related linear algebra.
	
	Even though a glMatrix utility already exists, and even used to be a part of this project,
	I've opted to (re)learn linear algebra and write my own transformations
	to have a first-principles understanding of it.
	
	TODO: actually implement this stuff...
	UPDATE: it appears using glMatrix is probably the right move here.
		it took multiple proper mathematicians working together to
		create and accumulate the knowledge present in that utility,
		and it seems to be thoroughly open source.
*/

/*
============================================================
Matrix x Vector:
					x
					y
					z
					1
ax	bx	cx	dx		x = x*ax + y*bx + z*cx + dx
ay	by	cy	dy		y = x*ay + y*by + z*cy + dy
az	bz	cz	dz		z = x*az + y*bz + z*cz + dz
0	0	0	1		d = 1

------------------------------------------------------------
Basis.

Excluding the offset, the matrix above could be described as a matrix which
transforms the vectors from (i,j,k):
	i = [1,0,0]
	j = [0,1,0]
	k = [0,0,1]
to the vectors (a,b,c):
	a = [ax,ay,az]
	b = [bx,by,bz]
	c = [cx,cy,cz]
respectively.

An "Inverse Basis Transformation" on the other hand would
transform the vectors back from (a,b,c) to (i,j,k), but this requires being able
to get the inverse of a 3x3 matrix.

Using my code to solve systems of equations,
we will want to solve a 9x9 system to find
what transformation will turn the basis-transformation
into the identity-transformation.

------------------------------------------------------------
Scaling.

from:	[x, y, z, 1]
to:		[x*a, y*b, z*c, 1]

a	0	0	0		x = x*a
0	b	0	0		y = y*b
0	0	c	0		z = z*c
0	0	0	1		d = 1

------------------------------------------------------------
Translation.

from:	[x, y, z, 1]
to:		[x+a, y+b, z+c, 1]

1	0	0	a		x = x+a
0	1	0	b		y = y+b
0	0	1	c		z = z+c
0	0	0	1		d = 1

------------------------------------------------------------
Rotation.

from:	[x, y, z, 1]
to:		[x*c+y*s, y*c-x*s, z, 1]
where:	c="cos(r)", s="sin(r)"

from X to Y:
c	s	0	0		x = x*c + y*s
-s	c	0	0		y = y*c - x*s
0	0	1	0		z = z
0	0	0	1		d = 1

from X to Z:
c	0	s	0		x = x*c + z*s
0	1	0	0		y = y
-s	0	c	0		z = z*c - x*s
0	0	0	1		d = 1

from Z to Y:
1	0	0	0		x = x
0	c	-s	0		y = y*c - z*s
0	s	c	0		z = z*c + y*s
0	0	0	1		d = 1

Rotation about an arbitrary axis:

source:
	https://metalbyexample.com/linear-algebra/

given:
	axis: [x,y,z]
	s = sin(r)
	c = cos(r)

matrix (3x3):
x*x*(1-c) +   c		x*y*(1-c) - z*s		x*z*(1-c) + y*s
y*x*(1-c) + z*s		y*y*(1-c) +   c		y*z*(1-c) - x*s
z*x*(1-c) - y*s		z*y*(1-c) + x*s		z*z*(1-c) +   c

WARNING: this matrix may assume anti-Cartesian z (i.e. forewards is -z, "Right-handed")
instead of Cartesian z (forewards is +z, "Left-handed").

------------------------------------------------------------
Object-Look-at-Point

given:
	eye:	[ex,ey,ez,*]
	point:	[px,py,pz,*]
	up:		[ux,uy,uz,*]

computed:
	zdir:	normalized (point - eye)								the direction that is foreward from the eye's perspective.
	ydir:	normalized vectorRejection of (up - eye) along (fwdir)	the direction that is up from the eye's perspective.
	xdir:	normalized cross product of (fwdir) and (updir)			the direction that is right from the eye's perspective.

operations:
	- transform object to face correct direction.
		basis(xdir, ydir, zdir);
	- translate object into position.
		translate(ex, ey, ez);

Camera Look-at-Point

this is like the object-look-at-point transformation,
but from the object's perspective it is the world that is transformed,
thus we effectively perform the inverse of above transformation.

operations:
	- translate world to camera position.
		translate(-ex, -ey, -ez);
	- perform inverse basis transformation.
		basisInverse(xdir, ydir, zdir);
		
------------------------------------------------------------
Project View-Frustum to Clip-space.

source:
	https://metalbyexample.com/linear-algebra/
derivation:
	http://www.songho.ca/opengl/gl_projectionmatrix.html

This uses the 4th dimension even more heavily
than most "affine transformations".
I tried to follow the derivation but my math is a bit rusty,
so I'll just copy their matrix for now.

given:
	n = z_near
	f = z_far
	r = x_right
	t = y_top

matrix:
n/r		0		0			0
0		n/t		0			0
0		0		-f/(f-n)	-f*n/(f-n)
0		0		-1			0

WARNING: this may also be a right-handed matrix, meaning
we will need to revise the matrix by flipping the signs
on "f" and "n".

------------------------------------------------------------

*/




