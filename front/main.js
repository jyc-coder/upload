import "./style.css";
import axios from "axios";

// 업로드할 이미지를 미리보기
document.querySelector(".addImage").addEventListener("change", () => {
  const reader = new FileReader();
  // 이미지 파일이 아닌 경우 경고창 띄우기
  // jpg, png, jpeg 파일만 업로드 가능
  if (
    !["image/jpeg", "image/png", "image/jpg"].includes(
      document.querySelector(".addImage").files[0].type
    )
  ) {
    alert("이미지 파일만 업로드 가능합니다.");
    return;
  }
  reader.onload = ({ target }) => {
    document.querySelector(".preview").src = target.result;
  };

  reader.readAsDataURL(document.querySelector(".addImage").files[0]);
  console.log(document.querySelector(".addImage").files[0]);
});

document.querySelector(".createProfileForm").addEventListener("submit", (e) => {
  e.preventDefault();
  //.addimage에 파일이 없으면 alert 호출
  if (!document.querySelector(".addImage").files[0]) {
    alert("이미지를 업로드 해주세요.");
    return;
  }
  const formData = new FormData();
  formData.append("image", document.querySelector(".addImage").files[0]);
  formData.append("name", document.querySelector(".nameInput").value);
  formData.append(
    "description",
    document.querySelector(".descriptionInput").value
  );
  console.log(formData);
  // 업로드 요청
  try {
    axios.post("http://localhost:3000/profiles", formData).then((res) => {
      console.log(res);
      alert("프로필이 생성되었습니다.");
      // 클릭 후 새로고침

      location.reload();
    });
  } catch (err) {
    alert("프로필 생성에 실패했습니다.");
    console.log(err);
  }
});

let lastProfileId = "";
let offset = 0;
// 페이지네이션 버튼 생성
// .pagination에 버튼 생성
document.querySelector(".pagination").innerHTML = `
<button class="prevBtn">이전</button>
  <button class="nextBtn">다음</button>
`;

document.querySelector(".prevBtn").style.display = "none";
document.querySelector(".nextBtn").style.display = "none";
// 서버에서 이미지 가져오기
axios
  .get("http://localhost:3000/profiles?offset=${offset}&limit=5")
  .then((res) => {
    console.log(res);
    document.querySelector(".nextBtn").style.display = "block";
    res.data.forEach((item) => {
      document.querySelector(".profileList").innerHTML += `
      <div class="profileItem">
        <img src="http://localhost:3000/uploads/${item.imageKey}" class="profileImage" />
        <div class="profileInfo">
        <h3>이름 :${item.name}</h3> 
        <p>소개 :${item.description}</p>
        </div>
      </div>
    `;
    });
  })
  .catch((err) => {
    alert("프로필을 불러오는데 실패했습니다.");
  });

// 버튼 클릭시 이벤트 생성 다음 페이지
document.querySelector(".nextBtn").addEventListener("click", () => {
  axios
    .get(`http://localhost:3000/profiles?offset=${offset + 5}&limit=5`)
    .then((res) => {
      console.log(res.data);
      offset = offset + 5;
      if (offset > 0) {
        document.querySelector(".prevBtn").style.display = "block";
      }
      // .profileList 초기화
      document.querySelector(".profileList").innerHTML = "";
      res.data.forEach((item) => {
        document.querySelector(".profileList").innerHTML += `
          <div class="profileItem">
            <img src="http://localhost:3000/uploads/${item.imageKey}" class="profileImage" />
            <div class="profileInfo">
            <h3>이름 :${item.name}</h3>
            <p>소개 :${item.description}</p>
            </div>
          </div>
        `;
      });

      // 만약 data 길이가 5보다 작다면 다음 버튼 생성 되지 않게 설정
      if (res.data.length < 5) {
        document.querySelector(".nextBtn").style.display = "none";
      } else {
        document.querySelector(".prevBtn").style.display = "block";
      }
    });
});

document.querySelector(".prevBtn").addEventListener("click", () => {
  axios
    .get(`http://localhost:3000/profiles?offset=${offset - 5}&limit=5`)
    .then((res) => {
      console.log(res.data);
      offset = offset - 5;
      if (offset === 0) {
        document.querySelector(".prevBtn").style.display = "none";
      } else {
        document.querySelector(".nextBtn").style.display = "block";
      }
      // .profileList 초기화
      document.querySelector(".profileList").innerHTML = "";
      res.data.forEach((item) => {
        document.querySelector(".profileList").innerHTML += `
          <div class="profileItem">
            <img src="http://localhost:3000/uploads/${item.imageKey}" class="profileImage" />
            <div class="profileInfo">
            <h3>이름 :${item.name}</h3>
            <p>소개 :${item.description}</p>
            </div>
          </div>
        `;
      });
    });
});
