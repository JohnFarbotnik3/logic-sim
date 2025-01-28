#include <cassert>
#include <cstdlib>
#include "SystemOfEquations.cpp"
#include "Random.cpp"

// TODO: ...test some unsolvable systems as well...

struct SystemOfEquations_test {
	using FLOAT_T = double;

	// precision factors.
	const FLOAT_T EPS = 0.0001;
	const FLOAT_T ERR = 0.0001;
	const FLOAT_T TSM = 0.0001;

	void print_message(const std::string a) {
		/*
		printf("%s\n", a.c_str());
		//*/
	}
	void print_result(const std::vector<FLOAT_T>& arr, const std::string a) {
		/*
		printf("%s\n", a.c_str());
		for(int x=0;x<arr.size();x++) printf("%.4f\t", arr[x]);
		printf("\n");
		//*/
	}
	void print_matrix(const SystemOfEquations<FLOAT_T>& mat, std::string a) {
		/*
		printf("%s\n", a.c_str());
		mat.print("", "\n");
		//*/
	}

	bool close_enough(FLOAT_T a, FLOAT_T b) {
		const FLOAT_T e = ERR;
		const FLOAT_T d = b-a;
		return (-e < d) & (d < e);
	}

	void run(int seed) {
		// create random number distributions.
		auto dist_N = Random_int<int>(seed, 2, 10);
		auto dist_V = Random_real<FLOAT_T>(seed, -1, +1);
		// generate random solutions.
		for(int S=0;S<10000;S++) {
			// generate random solution.
			const int N = dist_N.next();
			std::vector<FLOAT_T> solution(N);
			for(int x=0;x<N;x++) solution[x] = dist_V.next();
			// create system of equations.
			SystemOfEquations<FLOAT_T> matrix(N);
			for(int x=0;x<N;x++) {
				matrix.set(x, x, 1.0f);
				matrix.set(N, x, solution[x]);
			}
			print_matrix(matrix, "matrix");
			// shuffle system of equations.
			auto dist_R = Random_int<int>(seed, 0, N-1);
			for(int Q=0;Q<N*5;Q++) {
				int row_src = dist_R.next();
				int row_dst = dist_R.next();
				FLOAT_T m = dist_V.next();
				if(std::abs(m) > EPS) {
					assert(row_src < N && row_dst < N);
					if(row_src == row_dst)	matrix.row_scale(row_src, m);
					else					matrix.row_add(row_dst, row_src, m);
				}
			}
			print_matrix(matrix, "shuffled");
			// ensure all values arent so small they cause precision problems.
			bool too_small = false;
			for(int x=0;x<N;x++) for(int y=0;y<N;y++) {
				const FLOAT_T value = matrix.get(x,y);
				too_small |= (std::abs(value) < TSM) & (value != 0);
			}
			if(too_small) {
				print_message("value too small, skipping\n");
				continue;
			}
			// solve system of equations.
			std::vector<FLOAT_T> result(N);
			bool success = matrix.trySolveSystemOfEquations_NxN(result);
			bool matches = true;
			assert(success == true);
			for(int x=0;x<N;x++) matches &= close_enough(result[x], solution[x]);
			print_result(result, "result");
			print_result(solution, "solution");
			assert(matches == true);
		}
	}

	SystemOfEquations_test(int seed) {
		run(seed);
	}
};

